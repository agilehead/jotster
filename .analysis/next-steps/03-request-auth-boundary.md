# Request, Domain, And Auth Boundary

## Target Request Pipeline

Every API surface must share the same security pipeline.

```text
HTTP request
  -> safe host extraction
  -> domain canonicalization
  -> workspace_domain lookup
  -> workspace state check
  -> authentication
  -> membership/participant resolution
  -> RequestContext creation
  -> tenant-scoped data access creation
  -> authorization
  -> handler
```

The native API, agent API, and Zulip API can differ in wire shape, but not in security boundary.

## Host Resolution

Current domain normalization is only trim/lowercase. That is insufficient.

Required canonicalization:

```text
input Host header or trusted proxy host
  -> reject empty
  -> strip port
  -> lower-case
  -> IDNA/punycode canonicalize
  -> reject invalid host characters
  -> reject untrusted forwarded host unless proxy is configured
```

Bad:

```ts
const host = req.headers["host"];
const workspaceId = await resolveWorkspaceIdByDomain(db, host);
```

Good:

```ts
const host = hostResolver.GetCanonicalHost(req);
const workspace = await workspaceResolver.ResolveActiveWorkspaceByHost(host);
```

## Workspace Context

`RequestContext` should contain all identity needed for downstream security.

Target fields:

```ts
class RequestContext {
  WorkspaceId!: string;
  Domain!: string;
  IdentityId!: string;
  WorkspaceMemberId!: string;
  ParticipantId!: string;
  AuthKind!: string;        // session | api_credential | root | internal_job
  AuthenticatorId?: string; // session id or credential id
  Audience!: string;        // native | agent | zulip
  Scopes!: string[];
}
```

`WorkspaceId` must be immutable after creation.

## Session Authentication

Sessions are workspace-scoped. A session issued on one workspace must fail on another workspace/domain.

Bad lookup:

```ts
await db.AuthSessions.Where((s) => s.SessionHash === hash).FirstOrDefaultAsync();
```

Good lookup:

```ts
await scopedDb.AuthSessions
  .Where((s) => s.SessionHash === hash)
  .Where((s) => s.State === "active")
  .Where((s) => s.ExpiresAt > now)
  .Where((s) => s.RevokedAt === undefined)
  .FirstOrDefaultAsync();
```

The workspace predicate must be automatic through scoped DB. The explicit filters are session validity rules.

## API Credential Authentication

API credentials are also workspace-scoped. This is especially important for external agents.

Bad:

```ts
const credential = await db.ApiCredentials
  .Where((c) => c.CredentialHash === hash)
  .FirstOrDefaultAsync();
```

Good:

```ts
const credential = await scopedDb.ApiCredentials
  .Where((c) => c.CredentialHash === hash)
  .Where((c) => c.RevokedAt === undefined)
  .Where((c) => c.ExpiresAt === undefined || c.ExpiresAt > now)
  .FirstOrDefaultAsync();
```

Then resolve participant:

```text
credential.participant_id
  -> participant in same workspace
  -> workspace_member in same workspace
  -> identity
```

## SSO Authentication

SSO providers are workspace-owned. Authentication must resolve provider only after workspace has been resolved.

Correct flow:

```text
Host: chat.acme.com
  -> workspace w_acme
  -> auth_provider where workspace_id = w_acme and provider_id = oidc_google
  -> validate callback state/nonce/code
  -> external_identity by workspace/provider/subject
  -> identity
  -> workspace_member
  -> participant
  -> workspace-scoped session
```

Bad flow:

```text
provider subject -> global identity -> choose workspace from request body
```

## Middleware Shape

Server should be composed explicitly:

```ts
app.use(safeRequestLimits(config));
app.use(resolveWorkspaceMiddleware(workspaceResolver));
app.use(authenticateMiddleware(authService));
app.use(createTenantScopedDbMiddleware(dbFactory));
app.use(bindApiAudienceMiddleware());
```

`createTenantScopedDbMiddleware` must return the scoped context type. It must not return a raw base context and rely on handlers to remember filtering.

Public routes must be explicitly declared:

```text
/health
/api/*/server-info
/auth/login
/auth/callback
```

Everything else must require `RequestContext`.

## Error Handling

Current error handling returns `String(err)`. Production must not expose internal errors.

Bad:

```ts
res.status(500).json({ result: "error", message: String(err) });
```

Good:

```ts
logger.Error(err, "Unhandled request failure");
res.status(500).json({
  result: "error",
  code: "internal_error",
  message: "Internal server error",
});
```

Validation/auth errors should use stable public codes:

```text
unknown_domain
unauthenticated
forbidden
not_found
invalid_request
rate_limited
internal_error
```

## Required Tests

- Unknown host is rejected.
- Unverified/inactive domain is rejected.
- Session for workspace A is rejected on workspace B domain.
- Credential for workspace A is rejected on workspace B domain.
- Same global identity can authenticate into two workspaces and gets different participants.
- User-controlled `workspaceId` in body cannot override context.
- Forwarded host is ignored unless proxy trust is configured.
- Production error responses do not contain exception text.
