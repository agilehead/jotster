# 24 - Data Export

## Overview

The data export module allows organization administrators to export all organization data for backup, compliance, or migration purposes. Exports produce a Zulip-compatible archive format, enabling data portability between Jotster and Zulip instances.

Two export types are supported: a full export (all data including private channels and DMs) and a public export (only public channel data, suitable for public archives). Exports run asynchronously -- the API returns immediately with an export ID, and the export job processes in the background. Progress and completion are communicated via real-time events.

The exported archive is a compressed directory containing JSON data files (organization settings, users, channels, subscriptions, messages), file attachments, user avatars, and custom emoji images.

Package: `organization`

## API Endpoints

| Method | Path                                    | Description                                   |
| ------ | --------------------------------------- | --------------------------------------------- |
| GET    | /api/v1/export/realm                    | List all data exports for the organization    |
| POST   | /api/v1/export/realm                    | Initiate a new data export                    |
| DELETE | /api/v1/export/realm/{export_id}        | Delete a completed export                     |
| GET    | /api/v1/export/realm/consents           | Get data export consent state                 |

### GET /api/v1/export/realm

Returns all data exports for the organization, including pending, in-progress, completed, and failed exports. Only organization administrators can access this endpoint.

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "exports": [
    {
      "id": "export_abc123",
      "acting_user_id": "user_1",
      "export_time": 1700000000,
      "deleted_timestamp": null,
      "failed_timestamp": null,
      "export_url": "/exports/export_abc123.tar.gz",
      "pending": false,
      "export_type": "full"
    }
  ]
}
```

### POST /api/v1/export/realm

Initiate a new data export. Only organization administrators can start an export.

**Request parameters:**
- `export_type` (string, optional, default `"full"`) -- `"full"` for all data, `"public"` for public channel data only

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "id": "export_abc123"
}
```

The export runs asynchronously. Clients receive `realm_export` events as the export progresses.

### DELETE /api/v1/export/realm/{export_id}

Delete a completed export. Removes both the export record and the exported archive file from storage. Only organization administrators can delete exports.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### GET /api/v1/export/realm/consents

Get the data export consent state. Returns a list of users and whether they have consented to their data being included in organization exports. Only organization administrators can access this endpoint.

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "export_consents": [
    {
      "user_id": "user_abc123",
      "consented": true
    },
    {
      "user_id": "user_def456",
      "consented": false
    }
  ]
}
```

## Data Model

### `data_export`

| Column         | Type   | Constraints                          | Description                              |
| -------------- | ------ | ------------------------------------ | ---------------------------------------- |
| id             | string | PK                                   | Nanoid                                   |
| tenant_id      | string | FK -> tenant, NOT NULL               | Tenant scope                             |
| requester_id   | string | FK -> user, NOT NULL                 | The admin who initiated the export       |
| export_type    | string | NOT NULL                             | `"full"` or `"public"`                   |
| status         | string | NOT NULL, default "pending"          | `"pending"`, `"in_progress"`, `"completed"`, `"failed"` |
| url            | string | nullable                             | Download URL when export is completed    |
| error_message  | text   | nullable                             | Error details if export failed           |
| created_at     | int    | NOT NULL                             | Unix milliseconds                        |
| completed_at   | int    | nullable                             | Unix milliseconds when export completed  |
| failed_at      | int    | nullable                             | Unix milliseconds when export failed     |

**Indexes:**

| Name                          | Columns                       | Purpose                                 |
| ----------------------------- | ----------------------------- | --------------------------------------- |
| ix_data_export_tenant         | (tenant_id, created_at)       | List exports for a tenant               |

## Export Format

The exported archive is a `.tar.gz` file containing Zulip-compatible JSON files and binary assets. The directory structure is:

```
export/
├── realm.json              # Organization settings, users, channels, subscriptions
├── messages-000001.json    # Messages in batches (max 1,000,000 per file)
├── messages-000002.json    # Additional message batches (if needed)
├── uploads/                # File attachments
│   ├── records.json        # Metadata for all uploaded files
│   └── files/              # The actual file contents
│       ├── {path_id_1}
│       └── {path_id_2}
├── avatars/                # User avatar images
│   ├── records.json        # Metadata for all avatars
│   └── files/              # The actual avatar files
└── emoji/                  # Custom emoji images
    ├── records.json        # Metadata for all custom emoji
    └── files/              # The actual emoji image files
```

### realm.json

Contains the core organization data:
- `zulip_version` -- Jotster version (reported as Zulip-compatible version)
- `realm` -- organization settings (name, description, settings)
- `realm_user` -- all user records
- `realm_user_profile_field` -- custom profile field definitions
- `realm_user_profile_field_value` -- user profile field values
- `realm_bot` -- bot user records
- `realm_stream` -- channel records
- `realm_subscription` -- channel subscription records
- `realm_user_group` -- user group records
- `realm_emoji` -- custom emoji metadata
- `realm_domain` -- allowed email domains
- `realm_default_stream` -- default channel list

### messages-*.json

Each message batch file contains:
- `messages` -- array of message objects, each with:
  - `id`, `sender_id`, `type`, `content`, `rendered_content`, `subject` (topic)
  - `channel_id` (for channel messages), `dm_group_id` (for DMs)
  - `timestamp`, `edit_history`
  - `reactions` -- reactions on the message
  - `flags` -- flags on the message (per-user, included for the relevant users)

For `"public"` exports, only messages from public channels are included. For `"full"` exports, all messages (channels, DMs) are included.

## Storage Layout

Export archives are stored at:

```
{exports_dir}/{tenant_id}/{export_id}.tar.gz
```

The `exports_dir` is configured in `jotster.config.json`:

```json
{
  "exportsDir": "./exports"
}
```

## Repository Interface

```
getExports(tenantId)
  -> Result<DataExport[]>
```
Fetch all data export records for the tenant, ordered by `created_at` descending.

```
createExport(tenantId, requesterId, exportType)
  -> Result<DataExport>
```
Insert a new data export record with `status = "pending"`. Returns the created record.

```
updateExportStatus(exportId, status, url, errorMessage)
  -> Result<void>
```
Update the status of an export. Sets `completed_at` when status transitions to `"completed"`, and `failed_at` when status transitions to `"failed"`. Sets `url` when the export file is ready for download.

```
deleteExport(exportId)
  -> Result<void>
```
Delete the data export record from the database.

## Domain Functions

### initiateExport

Validate that the requesting user is an organization administrator. Check that there is no other export currently in `"pending"` or `"in_progress"` status for the tenant (only one export can run at a time). Create the export record via `createExport` with `status = "pending"`. Start the export job asynchronously (enqueue for background processing). Emit a `realm_export` event with the initial export state. Return the export ID.

### processExport

This function runs as an asynchronous background job. Update the export status to `"in_progress"`. Collect all organization data:

1. **Organization settings** -- fetch the tenant record and all org-level configuration.
2. **Users** -- fetch all users (active and deactivated), profile fields, profile field values.
3. **Channels** -- fetch all channels (or only public channels for `"public"` exports).
4. **Subscriptions** -- fetch all channel subscriptions.
5. **User groups** -- fetch all user groups and memberships.
6. **Custom emoji** -- fetch all custom emoji metadata and copy image files.
7. **Messages** -- fetch all messages in batches. For `"full"` exports, include all channels and DMs. For `"public"` exports, include only public channel messages. Include reactions and edit history for each message.
8. **Uploads** -- fetch all attachment metadata and copy files. For `"public"` exports, only include attachments linked to public channel messages.
9. **Avatars** -- copy user avatar files.
10. **Realm domains** -- fetch all allowed email domains.
11. **Default streams** -- fetch the default channel list.

Write the collected data to the Zulip-compatible JSON format. Package everything into a `.tar.gz` archive at `{exports_dir}/{tenant_id}/{export_id}.tar.gz`. Update the export status to `"completed"` with the download URL. Emit a `realm_export` event.

If any step fails, update the export status to `"failed"` with the error message. Emit a `realm_export` event with the failure state.

### deleteExport

Validate that the requesting user is an organization administrator. Look up the export record. If the export has a file on disk, delete it. Delete the export record via `deleteExport` on the repository. Emit a `realm_export` event.

## Events

### `realm_export`

Emitted when the export list changes (export created, progressed, completed, failed, or deleted). Contains the full updated list of exports so clients can replace their local state.

Contains:
- `type`: `"realm_export"`
- `exports`: array of all export records for the tenant, each with:
  - `id` -- export ID
  - `acting_user_id` -- the admin who initiated the export
  - `export_time` -- Unix seconds when the export was initiated
  - `deleted_timestamp` -- Unix seconds when deleted (null if not deleted)
  - `failed_timestamp` -- Unix seconds when failed (null if not failed)
  - `export_url` -- download URL (null if not yet completed)
  - `pending` -- boolean, true if export is still in progress
  - `export_type` -- `"full"` or `"public"`
