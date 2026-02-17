# 19 - Organization Settings

## Overview

The organization settings module manages tenant/realm-level configuration -- the many org-level settings that control behavior, policies, and defaults across the entire organization. This includes the core tenant record, allowed email domains for registration, and default user settings for newly created accounts.

Zulip exposes a large number of realm settings (100+) that control everything from message editing policy to authentication methods. Rather than creating individual database columns for each setting, Jotster stores the bulk of these in a `settings_json` TEXT column on the `tenant` table. A few critical fields (subdomain, name, icon/logo URLs) are promoted to top-level columns for direct query access.

The module also manages realm domains -- the list of email domains that are allowed (or required) for user registration when `emails_restricted_to_domains` is enabled.

Package: `organization`

## API Endpoints

| Method | Path                                        | Description                                        |
| ------ | ------------------------------------------- | -------------------------------------------------- |
| PATCH  | /api/v1/realm                               | Update one or more organization settings           |
| GET    | /api/v1/realm/domains                       | List allowed email domains                         |
| POST   | /api/v1/realm/domains                       | Add an allowed email domain                        |
| PATCH  | /api/v1/realm/domains/{domain}              | Update domain settings (e.g., allow_subdomains)    |
| DELETE | /api/v1/realm/domains/{domain}              | Remove an allowed email domain                     |
| PATCH  | /api/v1/realm/user_settings_defaults        | Update default user settings for new users         |
| GET    | /api/v1/realm/icon                          | Get realm icon                                     |
| POST   | /api/v1/realm/icon                          | Upload realm icon                                  |
| DELETE | /api/v1/realm/icon                          | Delete realm icon                                  |
| GET    | /api/v1/realm/logo                          | Get realm logo                                     |
| POST   | /api/v1/realm/logo                          | Upload realm logo                                  |
| DELETE | /api/v1/realm/logo                          | Delete realm logo                                  |
| POST   | /api/v1/realm/deactivate                    | Deactivate the entire organization (owner only)    |

### PATCH /api/v1/realm

Update organization settings. Accepts any combination of Zulip realm setting parameters. Only organization administrators can call this endpoint.

**Request body (form-encoded or JSON):** Any subset of realm settings fields. For example:
- `name` -- organization display name
- `description` -- organization description
- `allow_message_editing` -- boolean
- `message_content_edit_limit_seconds` -- integer
- `invite_required` -- boolean
- etc.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### GET /api/v1/realm/domains

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "realm_domains": [
    {
      "domain": "example.com",
      "allow_subdomains": false
    }
  ]
}
```

### POST /api/v1/realm/domains

**Request:** `domain` (string), `allow_subdomains` (boolean, optional, default false).

### PATCH /api/v1/realm/domains/{domain}

**Request:** `allow_subdomains` (boolean).

### DELETE /api/v1/realm/domains/{domain}

Removes the domain from the allowed list.

### PATCH /api/v1/realm/user_settings_defaults

Update the default values that new users receive for their personal settings. Accepts any subset of user setting fields.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### GET /api/v1/realm/icon

Returns the realm icon image. Redirects to the icon URL or returns a default icon if none has been uploaded.

### POST /api/v1/realm/icon

Upload a new realm icon. Accepts multipart form data with a single image file. Only organization administrators can upload. Updates the `icon_url` column on the tenant record. Emits a `realm` event with `op: "update"` and `property: "icon_url"`.

### DELETE /api/v1/realm/icon

Delete the realm icon, reverting to the default. Only organization administrators can delete. Sets the `icon_url` column to null on the tenant record. Emits a `realm` event with `op: "update"` and `property: "icon_url"`.

### GET /api/v1/realm/logo

Returns the realm logo image. Redirects to the logo URL or returns a default logo if none has been uploaded.

### POST /api/v1/realm/logo

Upload a new realm logo. Accepts multipart form data with a single image file. Only organization administrators can upload. Updates the `logo_url` column on the tenant record. Emits a `realm` event with `op: "update"` and `property: "logo_url"`.

### DELETE /api/v1/realm/logo

Delete the realm logo, reverting to the default. Only organization administrators can delete. Sets the `logo_url` column to null on the tenant record. Emits a `realm` event with `op: "update"` and `property: "logo_url"`.

### POST /api/v1/realm/deactivate

Deactivate the entire organization. Only the organization owner can call this endpoint. Deactivation is irreversible -- all users are logged out, all event queues are destroyed, and the organization becomes inaccessible. Returns a confirmation response.

**Request parameters:**
- None (the endpoint requires no body; authorization is sufficient)

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

## Data Model

### `tenant`

The core organization table. Most organization settings are stored in the `settings_json` column as a JSON blob.

| Column        | Type   | Constraints                          | Description                              |
| ------------- | ------ | ------------------------------------ | ---------------------------------------- |
| id            | string | PK                                   | Nanoid                                   |
| subdomain     | string | NOT NULL, UNIQUE                     | Subdomain for multi-tenant routing       |
| name          | string | NOT NULL                             | Organization display name                |
| description   | string | NOT NULL, default ""                 | Organization description                 |
| icon_url      | string | nullable                             | Organization icon URL                    |
| logo_url      | string | nullable                             | Organization logo URL                    |
| settings_json | text   | NOT NULL, default "{}"               | JSON blob of all organization settings   |
| active        | int    | NOT NULL, default 1                  | Boolean 0/1, whether tenant is live      |
| created_at    | int    | NOT NULL                             | Unix milliseconds                        |
| updated_at    | int    | NOT NULL                             | Unix milliseconds                        |

**Indexes:**

| Name                    | Columns      | Purpose                                |
| ----------------------- | ------------ | -------------------------------------- |
| uq_tenant_subdomain     | (subdomain)  | UNIQUE -- each subdomain maps to one tenant |

### Settings JSON Contents

The `settings_json` column stores all Zulip realm settings as a JSON object. Key settings include (non-exhaustive):

**Authentication & access:**
- `authentication_methods` -- JSON object of enabled auth methods
- `emails_restricted_to_domains` -- boolean, require email domain match
- `invite_required` -- boolean, require invitation to join
- `invite_to_realm_policy` -- int (who can send invitations)
- `enable_spectator_access` -- boolean, allow unauthenticated browsing
- `waiting_period_threshold` -- int, days before user becomes "full member"

**Channel policies:**
- `create_public_stream_policy` -- int (who can create public channels)
- `create_private_stream_policy` -- int (who can create private channels)
- `create_web_public_stream_policy` -- int (who can create web-public channels)

**Message policies:**
- `allow_message_editing` -- boolean
- `message_content_edit_limit_seconds` -- int (0 = no limit)
- `message_content_delete_limit_seconds` -- int
- `allow_edit_history` -- boolean, whether edit history is visible
- `message_retention_days` -- int (-1 = forever)
- `wildcard_mention_policy` -- int (who can use @-all mentions)

**Notifications & presence:**
- `presence_disabled` -- boolean
- `notification_sound` -- string (default notification sound name)

**Integrations:**
- `video_chat_provider` -- int
- `giphy_rating` -- int (GIPHY content rating level)
- `bot_creation_policy` -- int (who can create bots)

**Privacy:**
- `email_address_visibility` -- int (who can see email addresses)

**Display:**
- `default_language` -- string (e.g., `"en"`)
- `plan_type` -- int (affects feature availability)

### `realm_domain`

Allowed email domains for user registration.

| Column           | Type   | Constraints                          | Description                              |
| ---------------- | ------ | ------------------------------------ | ---------------------------------------- |
| id               | string | PK                                   | Nanoid                                   |
| tenant_id        | string | FK -> tenant, NOT NULL               | Tenant scope                             |
| domain           | string | NOT NULL                             | Email domain (e.g., `"example.com"`)     |
| allow_subdomains | int    | NOT NULL, default 0                  | 1 if subdomains are also allowed         |
| created_at       | int    | NOT NULL                             | Unix milliseconds                        |

**Indexes:**

| Name                          | Columns                   | Purpose                              |
| ----------------------------- | ------------------------- | ------------------------------------ |
| uq_realm_domain               | (tenant_id, domain)       | UNIQUE -- each domain listed once per tenant |

### `tenant_user_setting_default`

Stores the organization's default values for user settings. When a new user is created, their personal settings are initialized from these defaults.

| Column                            | Type   | Constraints                          | Description                                      |
| --------------------------------- | ------ | ------------------------------------ | ------------------------------------------------ |
| tenant_id                         | string | PK, FK -> tenant                     | Tenant scope (one row per tenant)                |
| settings_json                     | text   | NOT NULL, default "{}"               | JSON blob of default user settings               |

The `settings_json` contains the same fields as the user-level settings (e.g., `dense_mode`, `high_contrast_mode`, `color_scheme`, `notification_sound`, `enable_stream_desktop_notifications`, `enable_stream_push_notifications`, `email_notifications_batching_period_seconds`, `twenty_four_hour_time`, `starred_message_counts`, `fluid_layout_width`, `demote_inactive_streams`, `enable_drafts_synchronization`, etc.).

## Repository Interface

```
getTenant(tenantId)
  -> Result<Tenant>
```
Fetch the tenant record including its settings JSON. Used by many modules to check org-level policies.

```
updateTenantSettings(tenantId, settings)
  -> Result<Tenant>
```
Merge the provided settings into the tenant's `settings_json`. If the settings include top-level fields (`name`, `description`, `icon_url`, `logo_url`), update those columns directly as well. Set `updated_at` to current timestamp. Returns the updated tenant.

```
getRealmDomains(tenantId)
  -> Result<RealmDomain[]>
```
Fetch all allowed email domains for the tenant, ordered by `domain` ascending.

```
addRealmDomain(tenantId, domain, allowSubdomains)
  -> Result<RealmDomain>
```
Insert a new realm domain record. Fails if the domain already exists for the tenant (unique constraint).

```
updateRealmDomain(tenantId, domain, allowSubdomains)
  -> Result<RealmDomain>
```
Update the `allow_subdomains` flag for an existing realm domain. Fails if the domain does not exist.

```
removeRealmDomain(tenantId, domain)
  -> Result<void>
```
Delete the realm domain record matching the given domain. Fails if the domain does not exist.

```
getUserSettingDefaults(tenantId)
  -> Result<UserSettingDefaults>
```
Fetch the default user settings for the tenant. If no row exists, return an empty defaults object.

```
updateUserSettingDefaults(tenantId, updates)
  -> Result<UserSettingDefaults>
```
Merge the provided updates into the tenant's default user settings JSON. If no row exists, create one. Returns the updated defaults.

## Domain Functions

### updateOrgSettings

Validate that the requesting user is an organization administrator. Validate each setting value against its expected type and range (e.g., policy integers must be valid enum values, boolean fields must be 0/1, string fields must not exceed length limits). Merge the validated settings into the tenant record via `updateTenantSettings`. For settings that affect top-level columns (`name`, `description`, `icon_url`, `logo_url`), update those columns as well. Emit a `realm` event. If a single property was changed, emit with `op: "update"` and the property name. If multiple properties were changed, emit with `op: "update_dict"`.

### manageRealmDomains

Validate that the requesting user is an organization administrator.

For adding a domain: validate the domain format (must be a valid domain name, no protocol or path). Check that the domain is not already in the list. Insert via `addRealmDomain`. Emit a `realm_domains` event with `op: "add"`.

For updating a domain: validate the domain exists. Update via `updateRealmDomain`. Emit a `realm_domains` event with `op: "change"`.

For removing a domain: validate the domain exists. Delete via `removeRealmDomain`. Emit a `realm_domains` event with `op: "remove"`.

### updateUserSettingDefaults

Validate that the requesting user is an organization administrator. Validate each setting value against the user settings schema. Merge the updates via `updateUserSettingDefaults` on the repository. Emit a `realm_user_settings_defaults` event with `op: "update"`.

## Events

### `realm` with `op: "update"`

Emitted when a single organization setting is changed. Contains:
- `type`: `"realm"`
- `op`: `"update"`
- `property`: the setting name that changed (e.g., `"name"`, `"allow_message_editing"`)
- `value`: the new value

### `realm` with `op: "update_dict"`

Emitted when multiple organization settings are changed in one request. Contains:
- `type`: `"realm"`
- `op`: `"update_dict"`
- `property`: `"default"` (or the settings group name)
- `data`: object of changed setting key-value pairs

### `realm_domains` with `op: "add"` / `"change"` / `"remove"`

Emitted when the allowed email domains list changes. Contains:
- `type`: `"realm_domains"`
- `op`: `"add"`, `"change"`, or `"remove"`
- `realm_domain`: object with `domain` and `allow_subdomains` (for add/change) or just `domain` (for remove)

### `realm_user_settings_defaults` with `op: "update"`

Emitted when the default user settings are changed. Contains:
- `type`: `"realm_user_settings_defaults"`
- `op`: `"update"`
- `property`: the setting name that changed
- `value`: the new value

### `default_stream_groups`

Emitted when the default stream groups configuration changes. Contains the full updated list of default stream groups.
