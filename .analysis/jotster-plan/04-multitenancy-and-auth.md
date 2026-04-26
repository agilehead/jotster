# Multitenancy And Auth

## Tenancy Model

Jotster is multi-tenant: one deployment can host many isolated workspaces.

Domains route to workspaces:

```text
chat.acme.com       ─┐
jotster.beta.io     ─┼─► one Jotster deployment
ops.internal.dev    ─┘
                         ↓
                   workspace_domain
                         ↓
                     workspace_id
```

The domain is only a routing signal. The actual security boundary is `workspace_id` in the authenticated request context and in every workspace-owned row.

## Domain Resolution

Target table:

```sql
workspace_domain (
  workspace_id text not null,
  host         text not null,
  kind         text not null, -- primary | alias | api | admin
  verified_at  integer,
  created_at   integer not null,
  primary key (host),
  foreign key (workspace_id) references workspace(id)
)
```

Resolution:

```csharp
public async Task<WorkspaceContext?> ResolveByHostAsync(string host, CancellationToken ct)
{
    var normalizedHost = NormalizeHost(host);

    var domain = await db.WorkspaceDomains
        .Where(d => d.Host == normalizedHost)
        .Where(d => d.VerifiedAt != null)
        .SingleOrDefaultAsync(ct);

    if (domain is null)
    {
        return null;
    }

    return new WorkspaceContext(domain.WorkspaceId, domain.Host);
}
```

Rules:

- Host comparison must be canonicalized.
- Unknown host returns no workspace.
- Workspace lookup must happen before auth provider lookup.
- The resolved `workspace_id` must be immutable for the remainder of request handling.

## Auth Flow

```text
Request Host
  ↓
Resolve workspace_domain(host)
  ↓
Load workspace auth policy/providers
  ↓
Authenticate identity
  ↓
Find workspace_member for identity + workspace
  ↓
Resolve participant
  ↓
Issue or validate workspace-scoped session
```

The final authenticated context must include:

```text
workspace_id
identity_id
workspace_member_id
participant_id
credential_id or session_id
scopes
```

## Session Scope

Sessions must be workspace-scoped. A global login identity alone is not enough.

Correct:

```sql
auth_session (
  id              text primary key,
  workspace_id    text not null,
  identity_id     text not null,
  participant_id  text not null,
  token_hash      text not null unique,
  expires_at      integer not null,
  revoked_at      integer,
  created_at      integer not null
)
```

Bad:

```sql
auth_session (
  id text primary key,
  identity_id text not null,
  token_hash text not null
)
```

The bad shape allows ambiguous workspace context. The same identity may be a member of several workspaces with different roles and state.

## Cross-Domain Auth

Separate domains cannot rely on shared cookies. Use one of these patterns.

### Domain-Local Session

Each workspace domain owns its secure cookie:

```text
chat.acme.com/login
  → OIDC/SAML
  → chat.acme.com/callback
  → set cookie for chat.acme.com
```

Pros:

- Simple security model.
- No cross-domain cookie assumptions.
- Workspace context is clear.

### Central Auth Broker

A central auth service can authenticate globally, then redirect back to the workspace domain with a one-time code:

```text
chat.acme.com/login
  → auth.jotster.com?workspace=acme
  → IdP
  → auth.jotster.com/callback
  → redirect chat.acme.com/auth/exchange?code=one_time_code
  → chat.acme.com sets workspace-scoped cookie
```

The one-time code must be:

- Short-lived.
- Bound to target workspace/domain.
- Single-use.
- Stored hashed.
- Exchanged server-side.

Example:

```sql
auth_exchange_code (
  id              text primary key,
  code_hash       text not null unique,
  workspace_id    text not null,
  identity_id     text not null,
  redirect_host   text not null,
  expires_at      integer not null,
  consumed_at     integer,
  created_at      integer not null
)
```

## SSO Provider Model

Persona’s core idea is right: external auth identity is separate from product user/member.

Target tables:

```sql
auth_provider (
  workspace_id text not null,
  id           text not null,
  kind         text not null, -- oidc | saml | oauth
  display_name text not null,
  issuer       text,
  client_id    text,
  jwks_uri     text,
  saml_metadata text,
  enabled      integer not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id)
)

external_identity (
  id               text primary key,
  identity_id      text not null,
  provider_workspace_id text not null,
  auth_provider_id text not null,
  subject          text not null,
  email_at_login   text,
  last_login_at    integer,
  created_at       integer not null,
  unique (provider_workspace_id, auth_provider_id, subject)
)
```

Important:

- Do not key primary identity by email.
- Use provider subject for SSO identity.
- Email is metadata unless provider says it is verified.
- SSO provider config is workspace-scoped.

## API Credentials

Humans and agents both may have API credentials, but credentials are scoped.

```sql
api_credential (
  workspace_id    text not null,
  id              text not null,
  subject_kind    text not null, -- identity | participant | integration
  subject_id      text not null,
  token_hash      text not null unique,
  name            text not null,
  scopes_json     text not null,
  created_by_participant_id text,
  created_at      integer not null,
  expires_at      integer,
  revoked_at      integer,
  primary key (workspace_id, id)
)
```

Credential validation:

```csharp
public async Task<RequestContext> AuthenticateApiTokenAsync(
    WorkspaceContext workspace,
    string token,
    CancellationToken ct)
{
    var hash = HashToken(token);

    var credential = await db.ApiCredentials
        .Where(c => c.WorkspaceId == workspace.WorkspaceId)
        .Where(c => c.TokenHash == hash)
        .Where(c => c.RevokedAt == null)
        .SingleOrDefaultAsync(ct);

    if (credential is null)
    {
        throw new UnauthorizedException();
    }

    var participant = await ResolveParticipantAsync(
        workspace.WorkspaceId,
        credential.SubjectKind,
        credential.SubjectId,
        ct);

    return new RequestContext(
        workspace.WorkspaceId,
        participant.IdentityId,
        participant.Id,
        credential.Id,
        credential.Scopes);
}
```

No raw credential should be stored after initial display.

## Tenant Safety Rules

Every workspace-owned table:

- Has `workspace_id NOT NULL`.
- Uses composite PK or unique keys that include `workspace_id`.
- Is only queried through a request context carrying `workspace_id`.
- Has FKs that include `workspace_id` where possible.

Bad:

```csharp
var message = await db.Messages.SingleAsync(m => m.Id == messageId);
```

Correct:

```csharp
var message = await db.Messages.SingleOrDefaultAsync(
    m => m.WorkspaceId == context.WorkspaceId &&
         m.Id == messageId,
    ct);
```

Even better with composite FK:

```sql
message (
  workspace_id text not null,
  id           text not null,
  channel_id   text,
  primary key (workspace_id, id),
  foreign key (workspace_id, channel_id)
    references channel(workspace_id, id)
)
```

This prevents a row from referencing a channel in another workspace.

## Background Jobs And Events

Tenant context also applies to async work.

Bad:

```json
{
  "jobType": "send_notification",
  "notificationId": "n_123"
}
```

Correct:

```json
{
  "workspaceId": "w_acme",
  "jobType": "send_notification",
  "notificationId": "n_123"
}
```

Worker queries:

```csharp
var notification = await db.Notifications
    .Where(n => n.WorkspaceId == job.WorkspaceId)
    .Where(n => n.Id == job.NotificationId)
    .SingleAsync(ct);
```

The workspace ID must flow through:

- HTTP requests.
- Auth sessions.
- API credentials.
- DB queries.
- Domain events.
- Notification jobs.
- Upload paths.
- Webhook deliveries.
- Export jobs.

