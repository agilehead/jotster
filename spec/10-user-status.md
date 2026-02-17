# User Status Module

## Overview

Users can set a status message visible to others -- a short text with an optional emoji, such as "In a meeting" with a calendar emoji or "On vacation" with a palm tree. Status is distinct from presence (online/idle/offline) which is handled by the presence module (see `11-presence.md`). Status is an intentional, user-set message that persists until explicitly changed or cleared.

Each user has at most one status at any time, stored in the `user_status` table with the user's ID as the primary key. Setting a new status replaces the previous one. Sending an empty `status_text` with no emoji clears the status entirely.

The status emoji can be either a standard Unicode emoji or a custom realm emoji (see `15-custom-emoji.md`). The `reaction_type` field distinguishes between them, using the same type system as emoji reactions on messages.

## API Endpoints

### Zulip-Compatible Endpoints

| Method | Path                              | Auth Required | Description             |
| ------ | --------------------------------- | ------------- | ----------------------- |
| `POST` | `/api/v1/users/me/status`         | Yes           | Set own status          |
| `GET`  | `/api/v1/users/{user_id}/status`  | Yes           | Get a user's status     |

### Endpoint Details

#### POST /api/v1/users/me/status

Set or clear the authenticated user's status.

**Request (form-encoded):**

| Parameter       | Type   | Required | Description                                            |
| --------------- | ------ | -------- | ------------------------------------------------------ |
| `status_text`   | string | No       | Status text; empty string to clear text                |
| `emoji_name`    | string | No       | Emoji name (e.g., "calendar")                          |
| `emoji_code`    | string | No       | Emoji code (e.g., "1f4c5" for Unicode emoji)           |
| `reaction_type` | string | No       | "unicode_emoji" or "realm_emoji"                       |

To clear the status entirely, send `status_text` as an empty string and omit the emoji fields (or send them as empty strings). Individual fields can be updated independently -- omitting a field leaves its current value unchanged.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Invalid emoji name or code.

#### GET /api/v1/users/{user_id}/status

Retrieve a user's current status.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "status": {
    "status_text": "In a meeting",
    "emoji_name": "calendar",
    "emoji_code": "1f4c5",
    "reaction_type": "unicode_emoji"
  }
}
```

If the user has no status set, the `status` object will have empty/null fields:

```json
{
  "result": "success",
  "msg": "",
  "status": {
    "status_text": "",
    "emoji_name": null,
    "emoji_code": null,
    "reaction_type": null
  }
}
```

## Data Model

### user_status

Stores the current status for each user. One-to-one relationship with the `user` table. A row is created when a user first sets a status, and updated on subsequent changes. The row is not deleted when status is cleared; instead, the fields are set to empty/null values.

| Column          | Type    | Constraints              | Description                                            |
| --------------- | ------- | ------------------------ | ------------------------------------------------------ |
| `user_id`       | TEXT    | PK, FK -> user           | Owning user                                            |
| `tenant_id`     | TEXT    | NOT NULL, FK -> tenant   | Owning tenant (denormalized for query efficiency)      |
| `status_text`   | TEXT    | NOT NULL DEFAULT ''      | Status text message                                    |
| `emoji_name`    | TEXT    | NULL                     | Emoji name (e.g., "calendar", "tada")                  |
| `emoji_code`    | TEXT    | NULL                     | Emoji code (Unicode codepoint or custom emoji ID)      |
| `reaction_type` | TEXT    | NULL                     | Emoji type: "unicode_emoji" or "realm_emoji"           |
| `updated_at`    | INTEGER | NOT NULL                 | Unix milliseconds                                      |

**Indexes:**

- `ix_user_status_tenant` on `(tenant_id)` -- list all statuses for a tenant (used during initial data fetch).

## Repository Interface

### IUserStatusRepository

```
getStatus(tenantId: string, userId: string) -> Result<UserStatus | null>
getAllStatuses(tenantId: string) -> Result<UserStatus[]>
setStatus(tenantId: string, userId: string, statusText: string, emojiName: string | null, emojiCode: string | null, reactionType: string | null) -> Result<UserStatus>
clearStatus(tenantId: string, userId: string) -> Result<void>
```

### Method Details

#### getStatus

Retrieve the current status for a single user. Returns `null` if the user has never set a status.

#### getAllStatuses

Retrieve all non-empty statuses for a tenant. Used during the initial data fetch when a client connects (via `register_queue`). Returns only statuses where `status_text` is non-empty or `emoji_name` is non-null.

#### setStatus

Create or update the status for a user. Uses an upsert (INSERT ... ON CONFLICT UPDATE) since the `user_id` is the primary key. Sets `updated_at` to current Unix milliseconds.

#### clearStatus

Clear a user's status by setting `status_text` to an empty string and `emoji_name`, `emoji_code`, and `reaction_type` to null. Updates `updated_at`. The row is preserved (not deleted) so that `updated_at` tracking is maintained.

## Domain Functions

### setStatus

```
setStatus(repo: IUserStatusRepository, tenantId: string, userId: string, statusText: string | null, emojiName: string | null, emojiCode: string | null, reactionType: string | null) -> Result<UserStatus>
```

1. If `statusText` is provided as an empty string and no emoji fields are provided (or all are empty), treat this as a clear operation: call `repo.clearStatus` and emit a `user_status` event with cleared fields.
2. If `reaction_type` is provided, validate it is one of "unicode_emoji" or "realm_emoji".
3. If `reaction_type` is "realm_emoji", validate that the emoji exists in the tenant's custom emoji (cross-reference with the emoji module).
4. If `reaction_type` is "unicode_emoji", validate that `emoji_code` is a valid Unicode emoji codepoint.
5. Load the current status (if any) and merge provided fields with existing values. Fields that are omitted from the request retain their current values.
6. Call `repo.setStatus` to persist.
7. Emit a `user_status` event.
8. Return the updated status.

### clearStatus

```
clearStatus(repo: IUserStatusRepository, tenantId: string, userId: string) -> Result<void>
```

1. Call `repo.clearStatus`.
2. Emit a `user_status` event with cleared fields.

### getAllStatuses

```
getAllStatuses(repo: IUserStatusRepository, tenantId: string) -> Result<UserStatus[]>
```

1. Call `repo.getAllStatuses`.
2. Return the list. This is used during initial data fetch and does not emit events.

## Events

| Event Type      | Trigger                        | Payload                                                                                                            |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `user_status`   | Status text or emoji changed   | `{ type: "user_status", user_id, status_text, emoji_name, emoji_code, reaction_type }`                            |

The `user_status` event is broadcast to all active users in the tenant whenever any user's status changes. This includes both setting a new status and clearing an existing one. When status is cleared, the event payload contains empty/null values for the status fields.

All events are dispatched to the event queue module (see `02-event-queue.md`) for delivery to connected clients.
