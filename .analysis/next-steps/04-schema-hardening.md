# Schema Hardening

## Goal

The database should reject invalid cross-workspace or structurally inconsistent rows wherever SQLite can enforce the invariant. Application-level checks are still required, but schema constraints are the final backstop.

## Current Strengths

The migration already has strong foundations:

- Workspace-owned rows carry `workspace_id`.
- Workspace-owned ID tables mostly use primary key `(workspace_id, id)`.
- Foreign keys to workspace-owned tables include `workspace_id`.
- Domain rows are globally unique by domain.

## Gap 1: Session/Credential Identity Mismatch

Current shape stores both `identity_id` and `participant_id` in `auth_session` and `api_credential`.

Bad row the DB can currently allow:

```text
auth_session.workspace_id = w_acme
auth_session.identity_id = id_alice
auth_session.participant_id = p_bob
```

The participant points to Bob, while the identity says Alice.

Preferred fix: remove redundant `identity_id` from workspace-scoped session and credential rows. Derive identity through:

```text
participant -> workspace_member -> identity
```

Target:

```sql
auth_session (
  workspace_id    text not null,
  id              text not null,
  participant_id  text not null,
  session_hash    text not null,
  state           text not null,
  created_at      integer not null,
  expires_at      integer not null,
  revoked_at      integer,
  primary key (workspace_id, id),
  foreign key (workspace_id, participant_id) references participant(workspace_id, id),
  unique (workspace_id, session_hash)
)
```

If `identity_id` is retained for read optimization, add an invariant service and tests because SQLite cannot easily enforce the participant-to-identity join unless the key shape is changed.

## Gap 2: Message Container Shape

Current `message` has:

```text
container_kind
channel_id nullable
thread_id nullable
direct_chat_id nullable
```

Bad rows currently possible:

```text
container_kind = channel_thread
thread_id = null
direct_chat_id = dc_123
```

```text
container_kind = direct_chat
thread_id = t_123
direct_chat_id = dc_123
```

Add CHECK constraints:

```sql
check (
  (container_kind = 'channel_thread' and thread_id is not null and direct_chat_id is null)
  or
  (container_kind = 'direct_chat' and direct_chat_id is not null and thread_id is null and channel_id is null)
)
```

Stronger option: remove `channel_id` from `message` and derive it from `thread_id`. If retained for indexing, enforce consistency by making `thread` additionally unique on `(workspace_id, channel_id, id)` and FK message `(workspace_id, channel_id, thread_id)` to that key.

## Gap 3: Notification Delivery Participant Mismatch

Current delivery links a notification and endpoint independently.

Bad row currently possible:

```text
notification.participant_id = p_alice
notification_endpoint.participant_id = p_bob
notification_delivery links both
```

Preferred schema fix: carry `participant_id` on delivery and use composite foreign keys that include it.

Target:

```sql
notification_delivery (
  workspace_id     text not null,
  id               text not null,
  participant_id   text not null,
  notification_id  text not null,
  endpoint_id      text not null,
  status           text not null,
  attempts         integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, participant_id, notification_id)
    references notification(workspace_id, participant_id, id),
  foreign key (workspace_id, participant_id, endpoint_id)
    references notification_endpoint(workspace_id, participant_id, id)
)
```

This requires corresponding unique keys on notification and endpoint:

```sql
unique (workspace_id, participant_id, id)
```

## Gap 4: Permission Grant Subject And Resource Integrity

Current `permission_grant` stores free-form subject and resource strings.

Bad grant:

```text
workspace_id = w_acme
subject_kind = participant
subject_id = p_alice
resource_path = /workspaces/w_beta/channels/c_beta
action = channel.read
effect = allow
```

DB-level check for resource path prefix is possible in SQLite, but string prefix checks in migrations are brittle. Prefer a typed resource model or canonical service validation plus strict tests.

Minimum hardening:

```sql
check (effect in ('allow', 'deny'))
check (subject_kind in ('participant', 'role', 'group', 'system'))
```

Service hardening must additionally verify:

```text
resource_path == /workspaces/{workspace_id}
or resource_path starts with /workspaces/{workspace_id}/
```

Subject validation should ensure:

```text
participant -> participant(workspace_id, id)
role        -> role(workspace_id, id)
group       -> group(workspace_id, id)
system      -> allowlisted system subject names only
```

## Gap 5: Identity Email Ambiguity

`identity.primary_email` is indexed but not unique.

This can be correct if email is metadata, not identity. If product login by email is supported, use a separate verified email table.

Preferred future shape:

```sql
identity_email (
  identity_id text not null,
  normalized_email text not null,
  verified integer not null,
  primary key (identity_id, normalized_email),
  unique (normalized_email)
)
```

If workspaces can intentionally allow duplicate unverified emails, make that explicit in docs and never authenticate by `primary_email` alone.

## Gap 6: JSON Fields Need Ownership And Validation

Current schema uses multiple `*_json` text fields.

Acceptable uses:

- External provider claims snapshots.
- Notification payloads with schema version.
- Endpoint configs with typed per-kind validation.

Unsafe use:

```ts
preference.ValueJson = "{\"state\":\"" + state + "\"}";
```

Required rule:

```text
No manual JSON string construction. Serialize typed values through one utility.
```

## Required Migration Tests

Add tests that parse the migration and assert:

- `auth_session` and `api_credential` do not have mismatched identity/participant design.
- `message` has a container CHECK constraint.
- `notification_delivery` cannot bind notification and endpoint for different participants.
- `permission_grant.effect` and `subject_kind` are constrained.
- Every workspace-owned ID table has `(workspace_id, id)` primary key unless intentionally documented as a composite join table.
- Every FK to workspace-owned tables includes `workspace_id`.

