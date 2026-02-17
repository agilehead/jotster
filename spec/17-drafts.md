# 17 - Drafts

## Overview

The drafts module synchronizes message drafts across a user's devices. When a user starts composing a message in one client but does not send it, the draft is saved to the server so it can be retrieved and continued on any other client.

Drafts can be for channel messages (associated with a channel and topic) or direct messages (associated with a set of recipient user IDs). Each draft contains the raw markdown content that the user was composing.

Drafts are private to the user who created them. Other users cannot see or access another user's drafts. The module supports batch creation (multiple drafts in a single request) and individual update/delete operations.

Package: `drafts`

## API Endpoints

| Method   | Path                          | Auth Required | Description                     |
| -------- | ----------------------------- | ------------- | ------------------------------- |
| `GET`    | `/api/v1/drafts`             | Yes           | List all drafts for the user    |
| `POST`   | `/api/v1/drafts`             | Yes           | Create one or more drafts       |
| `PATCH`  | `/api/v1/drafts/{draft_id}`  | Yes           | Update an existing draft        |
| `DELETE` | `/api/v1/drafts/{draft_id}`  | Yes           | Delete a draft                  |

### Endpoint Details

#### GET /api/v1/drafts

Returns all drafts belonging to the authenticated user.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "count": 2,
  "drafts": [
    {
      "id": "d_abc123",
      "type": "stream",
      "to": ["ch_xyz789"],
      "topic": "release planning",
      "content": "I think we should target next Tuesday for...",
      "timestamp": 1739800000.0
    },
    {
      "id": "d_def456",
      "type": "private",
      "to": ["u_user1", "u_user2"],
      "topic": "",
      "content": "Hey, did you see the latest...",
      "timestamp": 1739790000.0
    }
  ]
}
```

**Draft object fields:**

| Field       | Type          | Description                                                          |
| ----------- | ------------- | -------------------------------------------------------------------- |
| `id`        | string        | Draft ID                                                             |
| `type`      | string        | `"stream"` for channel drafts, `"private"` for DM drafts            |
| `to`        | array         | For channel: array with one element (channel ID). For DM: array of recipient user IDs. |
| `topic`     | string        | Topic name for channel drafts; empty string for DM drafts            |
| `content`   | string        | Raw markdown content of the draft                                    |
| `timestamp` | float         | Last edit time as Unix seconds (float, matching Zulip convention)    |

#### POST /api/v1/drafts

Creates one or more drafts in a single request.

**Request (JSON):**

```json
{
  "drafts": [
    {
      "type": "stream",
      "to": [123],
      "topic": "release planning",
      "content": "I think we should...",
      "timestamp": 1739800000.0
    }
  ]
}
```

The `to` field in the request may contain integer or string IDs depending on the client. The server normalizes them to string IDs internally.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "ids": ["d_abc123"]
}
```

Returns the IDs of the created drafts in the same order as the input array.

#### PATCH /api/v1/drafts/{draft_id}

Updates an existing draft. The user must own the draft.

**Request (JSON):**

```json
{
  "draft": {
    "type": "stream",
    "to": [123],
    "topic": "updated topic",
    "content": "Updated draft content...",
    "timestamp": 1739810000.0
  }
}
```

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 404 if the draft does not exist or does not belong to the authenticated user.

#### DELETE /api/v1/drafts/{draft_id}

Deletes a draft. The user must own the draft.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 404 if the draft does not exist or does not belong to the authenticated user.

## Data Model

### `draft`

Stores message drafts for users. Each draft represents an unsent message being composed.

| Column              | Type    | Constraints                          | Description                                                   |
| ------------------- | ------- | ------------------------------------ | ------------------------------------------------------------- |
| `id`                | TEXT    | PK                                   | System-generated nanoid                                       |
| `tenant_id`         | TEXT    | NOT NULL, FK -> tenant               | Tenant scope                                                  |
| `user_id`           | TEXT    | NOT NULL, FK -> user                 | The user who owns this draft                                  |
| `type`              | TEXT    | NOT NULL                             | `"stream"` for channel drafts, `"private"` for DM drafts     |
| `channel_id`        | TEXT    | NULL, FK -> channel                  | Target channel (when type = `"stream"`)                       |
| `topic`             | TEXT    | NULL                                 | Topic name (when type = `"stream"`)                           |
| `recipient_ids_json`| TEXT    | NULL                                 | JSON array of recipient user ID strings (when type = `"private"`) |
| `content`           | TEXT    | NOT NULL                             | Raw markdown content of the draft                             |
| `updated_at`        | INTEGER | NOT NULL                             | Unix milliseconds of the last edit                            |
| `created_at`        | INTEGER | NOT NULL                             | Unix milliseconds                                             |

**Indexes:**

| Name                    | Columns                    | Purpose                                    |
| ----------------------- | -------------------------- | ------------------------------------------ |
| ix_draft_user           | (tenant_id, user_id)       | Fetch all drafts for a user                |

**Notes:**

- For channel drafts (`type = "stream"`), `channel_id` and `topic` are populated and `recipient_ids_json` is NULL.
- For DM drafts (`type = "private"`), `recipient_ids_json` contains a JSON array of user ID strings and `channel_id`/`topic` are NULL.
- The `recipient_ids_json` is stored as a sorted JSON array for consistency (e.g., `["u_abc","u_def"]`).
- The `updated_at` column stores milliseconds internally. The API response converts to Unix seconds (float) to match Zulip's `timestamp` field.

## Repository Interface

```
getDrafts(tenantId: string, userId: string)
  -> Result<Draft[]>
```
Fetch all drafts for the given user within the tenant. Returns drafts ordered by `updated_at` descending (most recently edited first).

```
createDrafts(tenantId: string, userId: string, drafts: NewDraft[])
  -> Result<Draft[]>
```
Batch insert one or more drafts. Each `NewDraft` includes `type`, `channelId` (nullable), `topic` (nullable), `recipientIdsJson` (nullable), `content`, and `updatedAt`. Returns the created drafts with their generated IDs.

```
updateDraft(tenantId: string, draftId: string, updates: DraftUpdate)
  -> Result<Draft>
```
Update an existing draft. `DraftUpdate` may include `type`, `channelId`, `topic`, `recipientIdsJson`, `content`, and `updatedAt`. The repository verifies that the draft belongs to the given tenant before updating. Returns the updated draft.

```
deleteDraft(tenantId: string, draftId: string)
  -> Result<void>
```
Delete a draft by ID. The repository verifies that the draft belongs to the given tenant.

```
getDraftById(tenantId: string, draftId: string)
  -> Result<Draft | null>
```
Fetch a single draft by ID within the tenant. Used for ownership validation before update/delete operations.

## Domain Functions

### createDrafts

```
createDrafts(
  repo: IDraftRepository,
  tenantId: string,
  userId: string,
  drafts: NewDraftInput[]
) -> Result<string[]>
```

1. Validate each draft in the input array:
   - `type` must be `"stream"` or `"private"`.
   - For `"stream"` drafts: `to` must contain exactly one channel ID.
   - For `"private"` drafts: `to` must contain at least one user ID.
   - `content` must be a non-empty string.
2. Normalize the input: convert `to` to the appropriate internal fields (`channel_id` for stream, `recipient_ids_json` for private).
3. Persist all drafts via the repository in a single batch operation.
4. Emit a `drafts` event with `op: "add"` for each created draft.
5. Return the list of created draft IDs.

### updateDraft

```
updateDraft(
  repo: IDraftRepository,
  tenantId: string,
  userId: string,
  draftId: string,
  update: DraftUpdateInput
) -> Result<void>
```

1. Fetch the existing draft by ID.
2. Verify the draft exists and belongs to the authenticated user. Return 404 if not found or not owned.
3. Validate the update fields (same rules as creation).
4. Persist the update via the repository. Set `updated_at` to the provided timestamp.
5. Emit a `drafts` event with `op: "update"`.

### deleteDraft

```
deleteDraft(
  repo: IDraftRepository,
  tenantId: string,
  userId: string,
  draftId: string
) -> Result<void>
```

1. Fetch the existing draft by ID.
2. Verify the draft exists and belongs to the authenticated user. Return 404 if not found or not owned.
3. Delete the draft via the repository.
4. Emit a `drafts` event with `op: "remove"`.

## Events

All draft events are delivered only to the user who owns the drafts (across all their connected clients). Other users never receive draft events.

### `drafts` with `op: "add"`

Emitted when one or more drafts are created.

**Payload:**

```json
{
  "type": "drafts",
  "op": "add",
  "drafts": [
    {
      "id": "d_abc123",
      "type": "stream",
      "to": ["ch_xyz789"],
      "topic": "release planning",
      "content": "I think we should...",
      "timestamp": 1739800000.0
    }
  ]
}
```

### `drafts` with `op: "update"`

Emitted when a draft is updated.

**Payload:**

```json
{
  "type": "drafts",
  "op": "update",
  "draft": {
    "id": "d_abc123",
    "type": "stream",
    "to": ["ch_xyz789"],
    "topic": "updated topic",
    "content": "Updated content...",
    "timestamp": 1739810000.0
  }
}
```

### `drafts` with `op: "remove"`

Emitted when a draft is deleted.

**Payload:**

```json
{
  "type": "drafts",
  "op": "remove",
  "draft_id": "d_abc123"
}
```

**Notes:**

- Draft events use the same serialization format as the `GET /drafts` response for draft objects.
- The `timestamp` in events is Unix seconds (float), matching the API response format, even though internal storage uses integer milliseconds.
