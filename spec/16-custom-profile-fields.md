# Custom Profile Fields Module

## Overview

Organization administrators can define custom profile fields that appear on every user's profile. These fields allow organizations to capture structured information beyond the built-in user fields -- for example, "GitHub username", "Pronouns", "Department", "Job title", or "Phone number".

Each custom profile field has a type that determines its input widget and validation rules. Jotster supports the same field types as Zulip:

| Type ID | Name              | Description                                                       |
| ------- | ----------------- | ----------------------------------------------------------------- |
| 1       | Short text        | Single-line text input                                            |
| 2       | Long text         | Multi-line text area                                              |
| 3       | List of options   | Dropdown select; options defined in `field_data_json`             |
| 4       | Date picker       | Date input (stored as ISO 8601 date string)                       |
| 5       | Link              | URL input with validation                                         |
| 6       | User              | Person picker; value is a user ID                                 |
| 7       | External account  | Username for an external service; `field_data_json` defines the service (subtype and URL pattern) |
| 8       | Pronouns          | Short text specifically for pronouns; rendered with special styling|

Fields have an `ordering` integer that determines the display order on user profiles. Admins can reorder fields via the API.

Field values are stored per-user in the `custom_profile_field_value` table. Each user can have at most one value per field. When a field is deleted, all associated values are also deleted.

## API Endpoints

### Zulip-Compatible Endpoints

| Method   | Path                                      | Auth Required | Description               |
| -------- | ----------------------------------------- | ------------- | ------------------------- |
| `GET`    | `/api/v1/realm/profile_fields`            | Yes           | List all configured fields|
| `POST`   | `/api/v1/realm/profile_fields`            | Yes (admin)   | Create a new field        |
| `PATCH`  | `/api/v1/realm/profile_fields`            | Yes (admin)   | Reorder fields            |
| `PATCH`  | `/api/v1/realm/profile_fields/{field_id}` | Yes (admin)   | Update a field            |
| `DELETE` | `/api/v1/realm/profile_fields/{field_id}` | Yes (admin)   | Delete a field            |

### Endpoint Details

#### GET /api/v1/realm/profile_fields

Returns all custom profile fields configured for the tenant, ordered by their `ordering` value.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "custom_fields": [
    {
      "id": "cpf_abc123",
      "name": "GitHub username",
      "hint": "Your GitHub handle",
      "field_type": 7,
      "field_data": "{\"subtype\": \"github\", \"url_pattern\": \"https://github.com/%(username)s\"}",
      "display_in_profile_summary": true,
      "order": 0
    },
    {
      "id": "cpf_def456",
      "name": "Pronouns",
      "hint": "",
      "field_type": 8,
      "field_data": "{}",
      "display_in_profile_summary": true,
      "order": 1
    },
    {
      "id": "cpf_ghi789",
      "name": "Department",
      "hint": "Select your department",
      "field_type": 3,
      "field_data": "{\"0\": {\"text\": \"Engineering\", \"order\": \"0\"}, \"1\": {\"text\": \"Design\", \"order\": \"1\"}, \"2\": {\"text\": \"Marketing\", \"order\": \"2\"}}",
      "display_in_profile_summary": false,
      "order": 2
    }
  ]
}
```

#### POST /api/v1/realm/profile_fields

Admin-only. Creates a new custom profile field.

**Request (form-encoded):**

| Parameter                    | Type   | Required | Description                                        |
| ---------------------------- | ------ | -------- | -------------------------------------------------- |
| `name`                       | string | Yes      | Field label displayed on profiles                  |
| `hint`                       | string | No       | Helper text shown below the input (default "")     |
| `field_type`                 | int    | Yes      | Field type (1-8)                                   |
| `field_data`                 | string | No       | JSON string with type-specific config (default "{}") |
| `display_in_profile_summary` | boolean| No       | Show in profile summary card (default false)       |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "id": "cpf_new123"
}
```

**Error (400):** Invalid field type, invalid field_data for the given type, or name already exists.

#### PATCH /api/v1/realm/profile_fields

Admin-only. Reorder all profile fields. The request body contains the complete ordered list of field IDs.

**Request (form-encoded):**

| Parameter | Type  | Required | Description                                  |
| --------- | ----- | -------- | -------------------------------------------- |
| `order`   | int[] | Yes      | JSON array of field IDs in desired order     |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** The provided list does not match the set of existing field IDs.

#### PATCH /api/v1/realm/profile_fields/{field_id}

Admin-only. Update a field's name, hint, field_data, or display settings.

**Request (form-encoded):**

| Parameter                    | Type    | Required | Description                                |
| ---------------------------- | ------- | -------- | ------------------------------------------ |
| `name`                       | string  | No       | New field label                            |
| `hint`                       | string  | No       | New hint text                              |
| `field_data`                 | string  | No       | New JSON config                            |
| `display_in_profile_summary` | boolean | No       | Show in profile summary                    |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Invalid field_data for the field's type.

#### DELETE /api/v1/realm/profile_fields/{field_id}

Admin-only. Deletes a custom profile field and all associated user values.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (404):** Field not found.

## Data Model

### custom_profile_field

Defines the custom profile fields available within a tenant. Each field has a type, optional configuration data, and a display order.

| Column                       | Type    | Constraints              | Description                                                         |
| ---------------------------- | ------- | ------------------------ | ------------------------------------------------------------------- |
| `id`                         | TEXT    | PK                       | System-generated nanoid                                             |
| `tenant_id`                  | TEXT    | NOT NULL, FK -> tenant   | Owning tenant                                                       |
| `name`                       | TEXT    | NOT NULL                 | Field label displayed on profiles                                   |
| `hint`                       | TEXT    | NOT NULL DEFAULT ''      | Helper text shown below the input                                   |
| `field_type`                 | INTEGER | NOT NULL                 | Field type: 1=short_text, 2=long_text, 3=select, 4=date, 5=link, 6=user, 7=external_account, 8=pronouns |
| `field_data_json`            | TEXT    | NOT NULL DEFAULT '{}'    | JSON with type-specific configuration (e.g., select options, external account URL pattern) |
| `display_in_profile_summary` | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, whether to show in the profile summary card            |
| `ordering`                   | INTEGER | NOT NULL                 | Display order (0-based, lower = higher)                             |
| `created_at`                 | INTEGER | NOT NULL                 | Unix milliseconds                                                   |

**Constraints:**

- UNIQUE (`tenant_id`, `name`) -- no duplicate field names within a tenant.

**Indexes:**

- `ix_custom_profile_field_tenant_order` on `(tenant_id, ordering)` -- efficient ordered listing.

### custom_profile_field_value

Stores each user's value for each custom profile field. A user may have zero or one value per field.

| Column           | Type    | Constraints                          | Description                                                    |
| ---------------- | ------- | ------------------------------------ | -------------------------------------------------------------- |
| `id`             | TEXT    | PK                                   | System-generated nanoid                                        |
| `tenant_id`      | TEXT    | NOT NULL, FK -> tenant               | Owning tenant (denormalized for query efficiency)              |
| `user_id`        | TEXT    | NOT NULL, FK -> user                 | User who owns this value                                       |
| `field_id`       | TEXT    | NOT NULL, FK -> custom_profile_field | Field this value belongs to                                    |
| `value`          | TEXT    | NOT NULL                             | The field value (string representation)                        |
| `rendered_value`  | TEXT    | NULL                                 | Rendered/processed value (e.g., Markdown to HTML for long text)|

**Constraints:**

- UNIQUE (`tenant_id`, `user_id`, `field_id`) -- one value per user per field.

**Indexes:**

- `ix_custom_profile_field_value_tenant_user` on `(tenant_id, user_id)` -- list all field values for a user.
- `ix_custom_profile_field_value_field` on `(field_id)` -- cascade delete when a field is removed.

### field_data_json Format by Type

The `field_data_json` column contains type-specific configuration as a JSON string:

- **Short text (1), Long text (2), Date (4), Link (5), Pronouns (8):** `{}` (no additional config)
- **List of options (3):**
  ```json
  {
    "0": {"text": "Engineering", "order": "0"},
    "1": {"text": "Design", "order": "1"},
    "2": {"text": "Marketing", "order": "2"}
  }
  ```
- **User (6):** `{}` (no additional config; value is a user ID)
- **External account (7):**
  ```json
  {
    "subtype": "github",
    "url_pattern": "https://github.com/%(username)s"
  }
  ```
  Common subtypes: "github", "twitter", "custom". For "custom", `url_pattern` is provided by the admin.

## Repository Interface

### ICustomProfileFieldRepository

```
getFields(tenantId: string) -> Result<CustomProfileField[]>
createField(tenantId: string, name: string, hint: string, fieldType: int, fieldData: string, order: int) -> Result<CustomProfileField>
updateField(tenantId: string, fieldId: string, updates: FieldUpdate) -> Result<CustomProfileField>
deleteField(tenantId: string, fieldId: string) -> Result<void>
reorderFields(tenantId: string, fieldIds: string[]) -> Result<void>
getFieldValues(tenantId: string, userId: string) -> Result<CustomProfileFieldValue[]>
setFieldValue(tenantId: string, userId: string, fieldId: string, value: string) -> Result<void>
```

### Method Details

#### getFields

Retrieve all custom profile fields for a tenant, ordered by `ordering`. Returns the full list of field definitions (not values).

#### createField

Insert a new field. Generates a nanoid for the `id`. Sets `created_at` to current Unix milliseconds. The `ordering` is set to the provided value; typically the next available position (count of existing fields).

#### updateField

Partial update of field properties (name, hint, field_data_json, display_in_profile_summary). The `field_type` cannot be changed after creation -- changing a field's type would invalidate existing values.

#### deleteField

Delete a field definition and cascade-delete all associated values from `custom_profile_field_value`. Uses the `ix_custom_profile_field_value_field` index for efficient cascade.

#### reorderFields

Update the `ordering` column for all fields based on the provided ordered list of field IDs. The first ID in the list gets `ordering=0`, the second gets `ordering=1`, and so on. Validates that the list contains exactly the same set of field IDs that exist for the tenant.

#### getFieldValues

Retrieve all field values for a specific user within a tenant. Returns a list of `(field_id, value, rendered_value)` tuples.

#### setFieldValue

Create or update a user's value for a specific field. Uses an upsert (INSERT ... ON CONFLICT UPDATE) since the UNIQUE constraint on `(tenant_id, user_id, field_id)` ensures at most one value per user per field. For long text fields (type 2), also computes and stores the `rendered_value`.

## Domain Functions

### createField

```
createField(repo: ICustomProfileFieldRepository, tenantId: string, actingUserId: string, name: string, hint: string, fieldType: int, fieldData: string) -> Result<CustomProfileField>
```

1. Validate the acting user is an admin (role <= 200).
2. Validate `fieldType` is between 1 and 8.
3. Validate `name` is non-empty.
4. Validate `fieldData` is valid JSON and matches the expected format for the given `fieldType`:
   - For type 3 (select): must be a JSON object with numbered keys, each containing `text` and `order`.
   - For type 7 (external account): must contain `subtype` and optionally `url_pattern`.
   - For other types: must be `{}` or empty.
5. Compute the ordering value as the count of existing fields (append to end).
6. Call `repo.createField` to persist.
7. Emit a `custom_profile_fields` event.
8. Return the created field.

### updateField

```
updateField(repo: ICustomProfileFieldRepository, tenantId: string, actingUserId: string, fieldId: string, updates: FieldUpdate) -> Result<CustomProfileField>
```

1. Validate the acting user is an admin (role <= 200).
2. Load the existing field. Return error if not found.
3. If `fieldData` is provided, validate it matches the expected format for the field's type.
4. Call `repo.updateField` to persist.
5. Emit a `custom_profile_fields` event.
6. Return the updated field.

### deleteField

```
deleteField(repo: ICustomProfileFieldRepository, tenantId: string, actingUserId: string, fieldId: string) -> Result<void>
```

1. Validate the acting user is an admin (role <= 200).
2. Load the existing field. Return error if not found.
3. Call `repo.deleteField` to delete the field and cascade-delete all values.
4. Emit a `custom_profile_fields` event.

### reorderFields

```
reorderFields(repo: ICustomProfileFieldRepository, tenantId: string, actingUserId: string, fieldIds: string[]) -> Result<void>
```

1. Validate the acting user is an admin (role <= 200).
2. Load all existing fields for the tenant.
3. Validate that `fieldIds` contains exactly the same set of IDs as existing fields (no additions, no removals, no duplicates).
4. Call `repo.reorderFields` to persist the new ordering.
5. Emit a `custom_profile_fields` event.

### setFieldValue

```
setFieldValue(repo: ICustomProfileFieldRepository, userRepo: IUserRepository, tenantId: string, userId: string, fieldId: string, value: string) -> Result<void>
```

1. Load the field definition. Return error if not found.
2. Validate the value against the field type:
   - **Short text (1), Pronouns (8):** non-empty string, max length 50.
   - **Long text (2):** non-empty string, max length 500.
   - **List of options (3):** value must match one of the option keys in `field_data_json`.
   - **Date (4):** must be a valid ISO 8601 date string (YYYY-MM-DD).
   - **Link (5):** must be a valid URL.
   - **User (6):** must be a valid, active user ID in the tenant.
   - **External account (7):** non-empty string (the username on the external service).
3. For long text fields, render the value (Markdown to HTML) and store in `rendered_value`.
4. Call `repo.setFieldValue` to persist.
5. Emit a `realm_user` event with `op: "update"` containing the updated custom profile field values for the user.

## Events

| Event Type              | Trigger                            | Payload                                                                                       |
| ----------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `custom_profile_fields` | Field config changed               | `{ type: "custom_profile_fields", fields: [ ...all_fields_in_order ] }`                       |
| `realm_user`            | User updates profile field values  | `{ type: "realm_user", op: "update", person: { user_id, custom_profile_field: { id, value, rendered_value } } }` |

The `custom_profile_fields` event is broadcast to all active users in the tenant whenever any field definition is created, updated, deleted, or reordered. The payload contains the complete, ordered list of all field definitions -- clients replace their local field list entirely.

The `realm_user` event with `op: "update"` is broadcast to all active users in the tenant when a user updates their own profile field values. This reuses the existing `realm_user` event type to keep profile data updates unified.

All events are dispatched to the event queue module (see `02-event-queue.md`) for delivery to connected clients.
