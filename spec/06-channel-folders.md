# Channel Folders Module

## Overview

Channel folders let users organize their subscribed channels into named groups in the sidebar. This is a per-user personal organization feature -- each user manages their own set of folders independently. A folder contains a list of channels (by reference) and has a user-defined name. Channels can appear in multiple folders or in no folder at all. Folders have no effect on permissions, notifications, or message delivery; they are purely a UI organizational tool.

This module lives in the `channels` package alongside the channels module, since folders are tightly coupled to the channel concept.

## API Endpoints

### Zulip-Compatible Endpoints

| Method   | Path                                    | Auth Required | Description                              |
| -------- | --------------------------------------- | ------------- | ---------------------------------------- |
| `GET`    | `/api/v1/channel_folders`               | Yes           | Get all channel folders for current user |
| `POST`   | `/api/v1/channel_folders`               | Yes           | Create a new folder                      |
| `PATCH`  | `/api/v1/channel_folders/{folder_id}`   | Yes           | Update folder name or channel list       |
| `PATCH`  | `/api/v1/channel_folders`               | Yes           | Reorder channel folders                  |
| `DELETE` | `/api/v1/channel_folders/{folder_id}`   | Yes           | Delete a folder                          |

### Endpoint Details

#### GET /api/v1/channel_folders

Returns all channel folders for the authenticated user, including the list of channel IDs in each folder.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "channel_folders": [
    {
      "id": "cf_abc123",
      "name": "Work Projects",
      "channels": ["ch_001", "ch_002", "ch_003"],
      "date_created": 1739800000,
      "date_updated": 1739800000
    },
    {
      "id": "cf_def456",
      "name": "Social",
      "channels": ["ch_004"],
      "date_created": 1739800000,
      "date_updated": 1739800000
    }
  ]
}
```

Note: The `date_created` and `date_updated` fields are Unix seconds per Zulip convention. The handler converts from internal milliseconds.

#### POST /api/v1/channel_folders

Creates a new channel folder for the authenticated user.

**Request (JSON):**

```json
{
  "name": "Work Projects",
  "channels": ["ch_001", "ch_002"]
}
```

| Parameter  | Type     | Required | Description                                      |
| ---------- | -------- | -------- | ------------------------------------------------ |
| `name`     | string   | Yes      | Folder display name                              |
| `channels` | string[] | No       | Channel IDs to include (defaults to empty list)  |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "channel_folder": {
    "id": "cf_abc123",
    "name": "Work Projects",
    "channels": ["ch_001", "ch_002"],
    "date_created": 1739800000,
    "date_updated": 1739800000
  }
}
```

**Error (400):** Name is empty or exceeds the maximum length (60 characters).
**Error (400):** A folder with the same name already exists for this user.
**Error (400):** One or more channel IDs do not exist or the user is not subscribed to them.

#### PATCH /api/v1/channel_folders/{folder_id}

Updates the name or channel list of an existing folder. Only the folder owner (the user who created it) can update it.

**Request (JSON):**

| Parameter  | Type     | Required | Description                             |
| ---------- | -------- | -------- | --------------------------------------- |
| `name`     | string   | No       | New folder name                         |
| `channels` | string[] | No       | Replacement list of channel IDs         |

At least one of `name` or `channels` must be provided.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "channel_folder": {
    "id": "cf_abc123",
    "name": "Updated Name",
    "channels": ["ch_001", "ch_005"],
    "date_created": 1739800000,
    "date_updated": 1739900000
  }
}
```

**Error (400):** New name already exists for this user.
**Error (403):** Folder does not belong to the authenticated user.
**Error (404):** Folder not found.

#### PATCH /api/v1/channel_folders

Reorders channel folders for the authenticated user. Accepts an ordered list of folder IDs and sets their display order accordingly. All folders belonging to the user in the realm must be included; partial lists are rejected.

**Request (JSON):**

```json
{
  "order": ["cf_def456", "cf_abc123"]
}
```

| Parameter | Type     | Required | Description                                              |
| --------- | -------- | -------- | -------------------------------------------------------- |
| `order`   | string[] | Yes      | Ordered list of all folder IDs for the authenticated user |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** The `order` list is empty or missing.
**Error (400):** The `order` list does not contain exactly the user's current set of folder IDs (missing or extra IDs).
**Error (403):** One or more folder IDs do not belong to the authenticated user.

#### DELETE /api/v1/channel_folders/{folder_id}

Deletes a folder. Only the folder owner can delete it. The channels themselves are unaffected -- they remain subscribed and accessible.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (403):** Folder does not belong to the authenticated user.
**Error (404):** Folder not found.

## Data Model

### channel_folder

Stores per-user channel folder definitions.

| Column       | Type    | Constraints                   | Description                          |
| ------------ | ------- | ----------------------------- | ------------------------------------ |
| `id`         | TEXT    | PK                            | System-generated nanoid              |
| `tenant_id`  | TEXT    | NOT NULL, FK -> tenant        | Owning tenant                        |
| `user_id`    | TEXT    | NOT NULL, FK -> user          | User who owns this folder            |
| `name`       | TEXT    | NOT NULL                      | Folder display name                  |
| `created_at` | INTEGER | NOT NULL                      | Unix milliseconds                    |
| `ordering`   | INTEGER | NOT NULL, DEFAULT 0           | Display order (lower values first)   |
| `updated_at` | INTEGER | NOT NULL                      | Unix milliseconds                    |

**Indexes:**

- `ix_channel_folder_tenant_user_name` UNIQUE on `(tenant_id, user_id, name)` -- enforces unique folder names per user within a tenant.
- `ix_channel_folder_tenant_user` on `(tenant_id, user_id)` -- supports listing all folders for a user.

### channel_folder_item

Join table linking folders to channels. A channel can appear in multiple folders. The order of channels within a folder is determined by the order they were added (insertion order).

| Column              | Type | Constraints                         | Description                       |
| ------------------- | ---- | ----------------------------------- | --------------------------------- |
| `channel_folder_id` | TEXT | NOT NULL, FK -> channel_folder (id) | Parent folder                     |
| `channel_id`        | TEXT | NOT NULL, FK -> channel (id)        | Channel included in the folder    |

**Primary Key:** `(channel_folder_id, channel_id)` -- composite primary key prevents duplicate entries.

**Indexes:**

- `ix_channel_folder_item_channel` on `(channel_id)` -- supports cleanup when a channel is archived or deleted (remove stale folder references).

**Notes:**

- When a channel is archived, its entries in `channel_folder_item` are NOT automatically removed. The client handles stale references by filtering out archived channels when displaying folder contents.
- When a folder is deleted, its entries in `channel_folder_item` are cascade-deleted via the foreign key constraint.
- There is no separate ordering column. Channels within a folder are returned in the order they appear in the `channels` array provided during creation or update.

## Repository Interface

### IChannelFolderRepository

```
getFolders(tenantId: string, userId: string) -> Result<ChannelFolder[]>
```
Returns all folders for the user within the tenant, each including its list of channel IDs. Folders are returned sorted by `ordering` ascending, then `created_at` ascending as a tiebreaker.

```
getFolderById(tenantId: string, folderId: string) -> Result<ChannelFolder | null>
```
Returns a single folder by ID, including its channel list. Returns null if not found.

```
createFolder(folder: NewChannelFolder) -> Result<ChannelFolder>
```
Inserts a new folder record and its channel associations. The `NewChannelFolder` input includes `tenantId`, `userId`, `name`, and `channelIds`. The repository generates the `id`, sets `createdAt` and `updatedAt`, inserts corresponding `channel_folder_item` rows, and returns the full record.

```
updateFolder(tenantId: string, folderId: string, updates: ChannelFolderUpdate) -> Result<ChannelFolder>
```
Updates the folder name and/or replaces the channel list. `ChannelFolderUpdate` may include `name` and `channelIds`. When `channelIds` is provided, the repository deletes all existing `channel_folder_item` rows for the folder and inserts the new set. Sets `updatedAt` to the current time.

```
deleteFolder(tenantId: string, folderId: string) -> Result<void>
```
Deletes the folder and its `channel_folder_item` entries (via cascade).

```
removeChannelFromAllFolders(tenantId: string, channelId: string) -> Result<void>
```
Removes a channel from all folders in the tenant. Called when a channel is permanently deleted (not on archive -- see notes above).

```
reorderFolders(tenantId: string, userId: string, folderIds: string[]) -> Result<void>
```
Sets the `ordering` column for the user's folders based on the position of each folder ID in the `folderIds` array. The first element receives `ordering = 0`, the second `ordering = 1`, and so on. All updates are performed within a single transaction.

## Domain Functions

### createFolder

```
createFolder(
  repo: IChannelFolderRepository,
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string,
  name: string,
  channelIds: string[]
) -> Result<ChannelFolder>
```

1. Validate the folder name: must be non-empty, must not exceed 60 characters.
2. Check that no existing folder for this user has the same name.
3. If `channelIds` is non-empty, verify all channel IDs exist and the user is subscribed to them.
4. Persist the folder and its channel associations via the repository.
5. Emit a `channel_folder` event with `op: "add"`.
6. Return the created folder.

### updateFolder

```
updateFolder(
  repo: IChannelFolderRepository,
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string,
  folderId: string,
  name: string | null,
  channelIds: string[] | null
) -> Result<ChannelFolder>
```

1. Fetch the existing folder; return error if not found.
2. Verify the folder belongs to the authenticated user; return 403 if not.
3. If `name` is provided and different from current, validate and check uniqueness.
4. If `channelIds` is provided, verify all channel IDs exist and the user is subscribed to them.
5. Persist updates via the repository.
6. Emit a `channel_folder` event with `op: "update"`.
7. Return the updated folder.

### deleteFolder

```
deleteFolder(
  repo: IChannelFolderRepository,
  tenantId: string,
  userId: string,
  folderId: string
) -> Result<void>
```

1. Fetch the existing folder; return error if not found.
2. Verify the folder belongs to the authenticated user; return 403 if not.
3. Delete the folder via the repository (cascade deletes `channel_folder_item` entries).
4. Emit a `channel_folder` event with `op: "remove"`.

### reorderFolders

```
reorderFolders(
  repo: IChannelFolderRepository,
  tenantId: string,
  userId: string,
  folderIds: string[]
) -> Result<void>
```

1. Validate that `folderIds` is non-empty.
2. Fetch all existing folders for the user via `getFolders`.
3. Verify the provided list contains exactly the same set of folder IDs as the user's current folders (no missing, no extra, no duplicates). Return 400 if not.
4. Verify all folder IDs belong to the authenticated user; return 403 if any do not.
5. Persist the new ordering via the repository's `reorderFolders` method.
6. Emit a `channel_folder` event with `op: "update"` including the full set of reordered folders so the client can re-render.

## Events

All events are dispatched to the event queue module for delivery to connected clients.

| Event Type       | Op       | Trigger          | Recipients      | Payload                                                                                        |
| ---------------- | -------- | ---------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `channel_folder` | `add`    | Folder created   | The folder owner | `{ type: "channel_folder", op: "add", channel_folders: [{ id, name, channels }] }`            |
| `channel_folder` | `update` | Folder updated   | The folder owner | `{ type: "channel_folder", op: "update", channel_folders: [{ id, name, channels }] }`         |
| `channel_folder` | `remove` | Folder deleted   | The folder owner | `{ type: "channel_folder", op: "remove", channel_folder_ids: ["cf_abc123"] }`                 |

**Notes:**

- Channel folder events are personal -- they are only sent to the user who owns the folder. Other users in the tenant do not receive these events.
- The `add` and `update` payloads include the full folder object so the client can render it without a follow-up fetch.
- The `remove` payload includes only the folder ID since the client just needs to know which folder to remove from the sidebar.
