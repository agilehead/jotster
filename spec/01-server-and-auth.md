# Server & Authentication Module

## Overview

This module handles server configuration discovery, user authentication via API keys, and root-level tenant management. It is the first thing any Zulip client interacts with: the client fetches server settings to learn about the realm, then authenticates to obtain an API key, and uses that key (via HTTP Basic Auth) on every subsequent request.

Multi-tenancy is resolved at the HTTP layer. The server settings endpoint determines the tenant from the request's subdomain (e.g., `acme.jotster.example` resolves to the `acme` tenant). All downstream operations carry the resolved `tenant_id`.

Root user authentication is a separate mechanism -- a server-level admin token used exclusively for internal tenant management endpoints (creating, listing, updating tenants). It is not part of the Zulip-compatible API surface.

## API Endpoints

### Zulip-Compatible Endpoints

| Method   | Path                          | Auth Required | Description                                                        |
| -------- | ----------------------------- | ------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/v1/server_settings`     | No            | Returns server version, feature level, auth methods, and realm info |
| `POST`   | `/api/v1/fetch_api_key`       | No            | Exchange email + password for an API key                           |
| `POST`   | `/api/v1/dev_fetch_api_key`   | No            | Dev-only: fetch API key without password                           |
| `POST`   | `/api/v1/jwt/fetch_api_key`   | No            | Fetch API key using JWT token (for SSO integrations)               |
| `POST`   | `/api/v1/users/me/api_key/regenerate` | Yes   | Regenerate the current user's API key                              |
| `DELETE` | `/api/v1/users/me`            | Yes           | Deactivate the authenticated user's own account                    |

### Internal Admin Endpoints

| Method  | Path                                     | Auth Required       | Description              |
| ------- | ---------------------------------------- | ------------------- | ------------------------ |
| `POST`  | `/internal/admin/tenants`                | Root token          | Create a new tenant      |
| `GET`   | `/internal/admin/tenants`                | Root token          | List all tenants         |
| `PATCH` | `/internal/admin/tenants/{tenant_id}`    | Root token          | Update a tenant          |

### Endpoint Details

#### GET /api/v1/server_settings

No authentication required. Tenant is resolved from the subdomain or server configuration.

**Response (200):**

```json
{
  "zulip_feature_level": 320,
  "zulip_version": "11.0",
  "zulip_merge_base": "11.0",
  "push_notifications_enabled": false,
  "is_incompatible": false,
  "email_auth_enabled": true,
  "require_email_format_usernames": true,
  "authentication_methods": {
    "password": true,
    "dev": true,
    "email": false,
    "ldap": false,
    "remoteuser": false,
    "github": false,
    "google": false,
    "saml": false,
    "openid connect": false
  },
  "external_authentication_methods": [],
  "realm_name": "Acme Corp",
  "realm_description": "Acme team chat",
  "realm_icon": "/avatar/realm/icon.png",
  "realm_uri": "https://acme.jotster.example",
  "realm_web_public_access_enabled": false
}
```

#### POST /api/v1/fetch_api_key

**Request (form-encoded):**

| Parameter  | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `username` | string | Yes      | User's email        |
| `password` | string | Yes      | User's password     |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "api_key": "abc123def456...",
  "email": "user@example.com",
  "user_id": 42
}
```

**Error (403):** Invalid credentials.

The server verifies the password against the stored hash in the `user` table. On success, it creates a new API key (or returns the existing active one), stores a hash of the key in the `api_key` table, and returns the raw key to the client. The raw key is never stored.

#### POST /api/v1/dev_fetch_api_key

Only available when the server is running in development mode. Accepts an email address (via `direct_email` form parameter) and returns an API key without requiring a password. Must be disabled in production.

**Request (form-encoded):**

| Parameter      | Type   | Required | Description  |
| -------------- | ------ | -------- | ------------ |
| `direct_email` | string | Yes      | User's email |

**Response (200):** Same shape as `POST /api/v1/fetch_api_key`.

#### POST /api/v1/jwt/fetch_api_key

No password required. The client provides a JWT token issued by an external SSO identity provider. The server validates the token signature against pre-configured SSO provider keys, extracts the user's email from the token claims, and returns an API key.

**Request (form-encoded):**

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `token`   | string | Yes      | JWT token issued by the SSO identity provider |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "api_key": "abc123def456...",
  "email": "user@example.com",
  "user_id": 42
}
```

**Error (403):** Invalid or expired JWT token.
**Error (404):** No user found matching the email in the JWT claims.

The server verifies the JWT signature using the public keys configured for the tenant's SSO provider. On success, it extracts the email claim, looks up the user, and generates or returns an API key following the same logic as `POST /api/v1/fetch_api_key` (minus the password check).

#### POST /api/v1/users/me/api_key/regenerate

Requires authentication. Revokes all existing API keys for the authenticated user and generates a fresh one. Useful when a user suspects their API key has been compromised.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "api_key": "new789key012...",
  "email": "user@example.com",
  "user_id": 42
}
```

The server revokes every active API key for the user within their tenant, generates a new raw API key, hashes it, stores the hash in the `api_key` table, and returns the raw key. Existing sessions using the old key will fail authentication on their next request.

#### DELETE /api/v1/users/me

Requires authentication. Deactivates the authenticated user's own account. This revokes all active API keys for the user, marks the user as inactive, and emits a `realm_user` event so other clients are notified.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### POST /internal/admin/tenants

Root token required via `Authorization: Bearer {root_token}` header.

**Request (JSON):**

```json
{
  "subdomain": "acme",
  "name": "Acme Corp",
  "description": "Acme team workspace"
}
```

**Response (201):**

```json
{
  "id": "t_abc123",
  "subdomain": "acme",
  "name": "Acme Corp",
  "description": "Acme team workspace",
  "created_at": 1739800000000
}
```

#### GET /internal/admin/tenants

Root token required. Returns all tenants.

**Response (200):**

```json
{
  "tenants": [
    {
      "id": "t_abc123",
      "subdomain": "acme",
      "name": "Acme Corp",
      "description": "Acme team workspace",
      "active": 1,
      "created_at": 1739800000000
    }
  ]
}
```

#### PATCH /internal/admin/tenants/{tenant_id}

Root token required. Partial update of tenant fields.

**Request (JSON):**

```json
{
  "name": "Acme Corp Updated",
  "active": 0
}
```

**Response (200):** Returns the updated tenant object.

## Data Model

### tenant

Stores tenant (realm/organization) records.

| Column        | Type    | Constraints          | Description                          |
| ------------- | ------- | -------------------- | ------------------------------------ |
| `id`            | TEXT    | PK                   | System-generated nanoid              |
| `subdomain`     | TEXT    | NOT NULL, UNIQUE     | Subdomain identifier for the tenant  |
| `name`          | TEXT    | NOT NULL             | Display name (realm_name)            |
| `description`   | TEXT    | NOT NULL DEFAULT ''  | Realm description                    |
| `icon_url`      | TEXT    | NULL                 | Realm icon URL                       |
| `logo_url`      | TEXT    | NULL                 | Realm logo URL                       |
| `settings_json` | TEXT    | NOT NULL DEFAULT '{}' | JSON blob of all org settings (see `19-organization-settings.md`) |
| `active`        | INTEGER | NOT NULL DEFAULT 1   | Boolean 0/1, whether tenant is live  |
| `created_at`    | INTEGER | NOT NULL             | Unix milliseconds                    |
| `updated_at`    | INTEGER | NOT NULL             | Unix milliseconds                    |

### api_key

Stores hashed API keys for authenticated users. A user may have multiple active API keys (e.g., one per client device). The raw key is returned once at creation time and never stored.

| Column       | Type    | Constraints              | Description                                      |
| ------------ | ------- | ------------------------ | ------------------------------------------------ |
| `id`         | TEXT    | PK                       | System-generated nanoid                           |
| `tenant_id`  | TEXT    | NOT NULL, FK -> tenant   | Owning tenant                                     |
| `user_id`    | TEXT    | NOT NULL, FK -> user     | Owning user (user table defined in users module)  |
| `key_hash`   | TEXT    | NOT NULL                 | SHA-256 hash of the raw API key                   |
| `created_at` | INTEGER | NOT NULL                 | Unix milliseconds                                 |
| `revoked_at` | INTEGER | NULL                     | Unix milliseconds; NULL means active              |

**Indexes:**

- `ix_api_key_tenant_user` on `(tenant_id, user_id)` -- look up keys by user within a tenant.
- `ix_api_key_key_hash` on `(key_hash)` -- look up key record by hash during auth.

### Notes on the user table

The `user` table is defined in the users module (`08-users.md`). This module references it for:

- Looking up users by email during `fetch_api_key`.
- Verifying passwords (password hash stored on the user record).
- Associating API keys with users.

## Repository Interface

### ITenantRepository

```
CreateTenant(tenant: NewTenant) -> Result<Tenant>
GetTenantById(tenantId: string) -> Result<Tenant?>
GetTenantBySubdomain(subdomain: string) -> Result<Tenant?>
ListTenants() -> Result<Tenant[]>
UpdateTenant(tenantId: string, updates: TenantUpdate) -> Result<Tenant>
```

### IApiKeyRepository

```
CreateApiKey(apiKey: NewApiKey) -> Result<ApiKey>
GetApiKeyByHash(keyHash: string) -> Result<ApiKey?>
GetActiveApiKeysForUser(tenantId: string, userId: string) -> Result<ApiKey[]>
RevokeApiKey(apiKeyId: string, revokedAt: int64) -> Result<void>
RevokeAllApiKeysForUser(tenantId: string, userId: string, revokedAt: int64) -> Result<void>
RevokeAndRegenerateApiKey(tenantId: string, userId: string, revokedAt: int64) -> Result<ApiKey>
```

## Domain Functions

### Tenant Resolution

```
ResolveTenant(subdomain: string) -> Result<Tenant>
```

Given a subdomain extracted from the HTTP request host, look up the corresponding tenant. Returns an error if the tenant does not exist or is inactive.

### Fetch API Key

```
FetchApiKey(tenantId: string, email: string, password: string) -> Result<FetchApiKeyResult>
```

1. Look up user by `(tenant_id, email)` in the user repository.
2. Return error if user not found or is deactivated.
3. Verify password against stored hash (bcrypt).
4. Check if user already has an active (non-revoked) API key. If so, return it. (The raw key is not stored, so a new key must be generated; the old one is revoked.)
5. Generate a new raw API key (32 bytes, base62-encoded).
6. Hash the key with SHA-256 and store the hash in the `api_key` table.
7. Return `{ api_key, email, user_id }`.

### Dev Fetch API Key

```
DevFetchApiKey(tenantId: string, email: string) -> Result<FetchApiKeyResult>
```

Same as `FetchApiKey` but skips password verification. Only callable when the server is in development mode. The domain function itself checks a configuration flag and returns an error if dev mode is not enabled.

### JWT Fetch API Key

```
JwtFetchApiKey(tenantId: string, token: string) -> Result<FetchApiKeyResult>
```

1. Retrieve the SSO provider configuration for the tenant (public keys, issuer, audience).
2. Verify the JWT signature, expiration, and issuer/audience claims. Return error if validation fails.
3. Extract the user's email from the JWT claims (typically the `email` or `sub` claim).
4. Look up user by `(tenant_id, email)` in the user repository.
5. Return error if user not found or is deactivated.
6. Generate a new raw API key (or revoke the existing one and create a new one), hash it, and store it — same key lifecycle as `FetchApiKey`.
7. Return `{ api_key, email, user_id }`.

### Regenerate API Key

```
RegenerateApiKey(tenantId: string, userId: string) -> Result<FetchApiKeyResult>
```

1. Revoke all active API keys for the user within the tenant.
2. Generate a new raw API key (32 bytes, base62-encoded).
3. Hash the key with SHA-256 and store the hash in the `api_key` table.
4. Return `{ api_key, email, user_id }`.

This is used when a user wants to invalidate all existing sessions and get a fresh key. The caller must already be authenticated (the endpoint is auth-required), so the `tenantId` and `userId` come from the `AuthenticatedUser` context.

### Authenticate Request

```
AuthenticateRequest(authHeader: string) -> Result<AuthenticatedUser>
```

Called on every authenticated API request. Extracts the email and API key from the `Authorization: Basic ...` header.

1. Base64-decode the header value to get `email:api_key`.
2. Hash the provided API key with SHA-256.
3. Look up the `api_key` record by hash.
4. Return error if not found or revoked.
5. Verify the email matches the user associated with the API key.
6. Return `{ tenant_id, user_id, email }`.

This function is used as middleware in the HTTP layer. Every authenticated endpoint receives the resolved `AuthenticatedUser` context.

### Deactivate Own Account

```
DeactivateOwnAccount(tenantId: string, userId: string) -> Result<void>
```

1. Mark user as deactivated in the user repository.
2. Revoke all active API keys for the user.
3. Emit a `realm_user` event (type: `remove`) so connected clients are notified.

### Server Settings

```
GetServerSettings(tenantId: string) -> Result<ServerSettings>
```

Build the server settings response from tenant data and server configuration. Static fields like `zulip_version` and `zulip_feature_level` come from compile-time constants. Tenant-specific fields (`realm_name`, `realm_description`, `realm_icon`, `realm_uri`) come from the tenant record. Authentication methods come from server configuration.

### Tenant Management (Root)

```
CreateTenant(rootToken: string, input: CreateTenantInput) -> Result<Tenant>
ListTenants(rootToken: string) -> Result<Tenant[]>
UpdateTenant(rootToken: string, tenantId: string, input: UpdateTenantInput) -> Result<Tenant>
```

All three functions first validate the root token against the server-configured root token. If it does not match, return an unauthorized error. The root token is a static secret set in server configuration (environment variable or config file), not stored in the database.

`CreateTenant` also creates a default admin user for the tenant (email and password provided in the input or generated).

## Events

| Event Type   | Trigger                        | Payload                                                  |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| `realm_user` | User deactivates own account   | `{ type: "realm_user", op: "remove", person: { user_id, full_name, email } }` |
| `realm`      | Tenant settings updated        | `{ type: "realm", op: "update", data: { ...changed_fields } }` |

These events are dispatched to the event queue module (see `02-event-queue.md`) for delivery to connected clients.
