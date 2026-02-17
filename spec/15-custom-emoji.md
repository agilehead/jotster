# 15 - Custom Emoji

## Overview

The custom emoji module allows organization administrators and members (depending on org policy) to upload custom emoji that can be used in messages and reactions. Custom emoji are tenant-scoped -- each organization has its own set. Emoji names must be unique among active emoji within a tenant.

Custom emoji are referenced in messages via the standard `:emoji_name:` shortcode syntax. When rendered, they produce `<img>` tags pointing to the emoji image URL. Custom emoji can also be used as reactions (with `reaction_type: "realm_emoji"`).

Deactivating a custom emoji (soft delete) prevents it from being used in new messages or reactions, but preserves it in existing messages and reactions where it was already used.

Package: `emoji`

## API Endpoints

| Method | Path                                    | Description                              |
| ------ | --------------------------------------- | ---------------------------------------- |
| GET    | /api/v1/realm/emoji                     | List all custom emoji for the organization |
| POST   | /api/v1/realm/emoji/{emoji_name}        | Upload a new custom emoji (multipart)    |
| DELETE | /api/v1/realm/emoji/{emoji_name}        | Deactivate a custom emoji                |

### GET /api/v1/realm/emoji

Returns a map of all custom emoji (both active and deactivated) keyed by emoji ID.

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "emoji": {
    "emoji_id_1": {
      "id": "emoji_id_1",
      "name": "party_parrot",
      "source_url": "/user_avatars/{realm_id}/emoji/images/{file_name}",
      "deactivated": false,
      "author_id": "user_id_1"
    }
  }
}
```

### POST /api/v1/realm/emoji/{emoji_name}

Upload a custom emoji image. The emoji name is specified in the URL path. The image file is sent as multipart form data.

**Request:** Multipart form data with a single image file field.

**Validation:**
- Emoji name must match `[a-z0-9_-]+` (lowercase alphanumeric, underscores, hyphens)
- Emoji name must not collide with a built-in Unicode emoji name
- Emoji name must be unique among active custom emoji in the tenant
- Image must be PNG, GIF, or JPEG
- Image file size must not exceed the configured limit (default 256 KB)

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### DELETE /api/v1/realm/emoji/{emoji_name}

Deactivates a custom emoji. The emoji is not deleted -- it is marked as inactive. Only the emoji author or an organization admin can deactivate an emoji.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

## Data Model

### `custom_emoji`

| Column     | Type   | Constraints                              | Description                              |
| ---------- | ------ | ---------------------------------------- | ---------------------------------------- |
| id         | string | PK                                       | Nanoid                                   |
| tenant_id  | string | FK -> tenant, NOT NULL                   | Tenant scope                             |
| name       | string | NOT NULL                                 | Emoji name (e.g., `"party_parrot"`)      |
| file_name  | string | NOT NULL                                 | Stored filename (e.g., `"party_parrot.png"`) |
| author_id  | string | FK -> user, NOT NULL                     | The user who uploaded the emoji          |
| is_active  | int    | NOT NULL, default 1                      | 1 if active, 0 if deactivated           |
| created_at | int    | NOT NULL                                 | Unix milliseconds                        |

**Indexes:**

| Name                            | Columns                               | Purpose                                  |
| ------------------------------- | ------------------------------------- | ---------------------------------------- |
| uq_custom_emoji_active_name     | (tenant_id, name) WHERE is_active = 1 | UNIQUE -- emoji names unique among active emoji |
| ix_custom_emoji_tenant          | (tenant_id, is_active)                | List all active emoji for a tenant       |

## Storage Layout

Emoji images are stored on the local filesystem at:

```
{uploads_dir}/{tenant_id}/emoji/{emoji_id}/{file_name}
```

For example, an emoji with ID `"abc123"` and filename `"party_parrot.png"` would be stored at `{uploads_dir}/tenant1/emoji/abc123/party_parrot.png`.

The public URL served to clients follows the Zulip convention: `/user_avatars/{realm_id}/emoji/images/{file_name}`.

## Repository Interface

```
getAllEmoji(tenantId)
  -> Result<CustomEmoji[]>
```
Fetch all custom emoji for the tenant (both active and deactivated), ordered by `name` ascending. Used by the list endpoint and for initial data load.

```
getEmojiByName(tenantId, name)
  -> Result<CustomEmoji | null>
```
Fetch an active custom emoji by name within the tenant. Returns null if no active emoji with that name exists. Used during upload to check uniqueness and during message rendering to resolve shortcodes.

```
getEmojiById(tenantId, emojiId)
  -> Result<CustomEmoji | null>
```
Fetch a custom emoji by ID. Used for reactions with `reaction_type: "realm_emoji"`.

```
createEmoji(tenantId, name, fileName, authorId)
  -> Result<CustomEmoji>
```
Insert a new custom emoji record with `is_active = 1`. Returns the created emoji.

```
deactivateEmoji(tenantId, name)
  -> Result<void>
```
Set `is_active = 0` on the custom emoji matching the given name in the tenant. Fails if no active emoji with that name exists.

## Domain Functions

### uploadEmoji

Validate that the requesting user has permission to upload custom emoji (based on the org's `add_custom_emoji_policy` setting). Validate the emoji name format: must match `[a-z0-9_-]+`, must not collide with a built-in Unicode emoji name, and must not match an existing active custom emoji name in the tenant. Validate the uploaded image file: must be PNG, GIF, or JPEG, and must not exceed the configured size limit. Generate the storage path `{uploads_dir}/{tenant_id}/emoji/{emoji_id}/{file_name}` and write the image file. Create the custom emoji record via `createEmoji`. Emit a `realm_emoji` event with `op: "update"`.

### deactivateEmoji

Validate that the requesting user is either the emoji author or an organization admin. Look up the active emoji by name. If not found, return a 404 error. Set `is_active = 0` via `deactivateEmoji` on the repository. The emoji image file is intentionally kept on disk so existing messages and reactions that reference it continue to render correctly. Emit a `realm_emoji` event with `op: "update"`.

## Events

### `realm_emoji` with `op: "update"`

Emitted when the custom emoji set changes (emoji uploaded or deactivated). Zulip sends the full updated emoji map so clients can replace their local cache entirely.

Contains:
- `type`: `"realm_emoji"`
- `op`: `"update"`
- `realm_emoji`: object map of all custom emoji (both active and deactivated), keyed by emoji ID, each containing `id`, `name`, `source_url`, `deactivated`, `author_id`
