# Config And Operational Hardening

## Goal

The server must fail closed in production and expose predictable operational behavior. Unsafe development defaults are acceptable only when explicitly in development mode.

## Current Risk

Current defaults are permissive:

```ts
production = false
devAuthEnabled = true
rootToken = ""
jwtSecret = ""
```

This is acceptable for a local scaffold only if production startup validates and refuses unsafe settings.

## Startup Validation

Add explicit validation:

```ts
export function validateConfig(config: ServerConfig): void {
  if (!config.production) {
    return;
  }

  require(config.devAuthEnabled === false, "dev auth must be disabled in production");
  require(config.jwtSecret.length >= 32, "jwt secret must be set in production");
  require(config.rootToken.length >= 32, "root token must be set or root access disabled");
  require(config.uploadsDir !== "", "uploads dir must be configured");
  require(config.listenUrl.startsWith("https://") || config.behindTrustedTlsProxy, "TLS required");
}
```

If root access is not part of the target design, remove `rootToken` entirely or replace it with an internal-only bootstrap mechanism.

## Environment Modes

Recommended modes:

```text
development
  - dev auth may be enabled
  - local HTTP allowed
  - verbose errors allowed locally only

test
  - deterministic test credentials
  - isolated database path
  - no production secrets required

production
  - dev auth disabled
  - secrets required
  - safe errors only
  - strict host/proxy config
```

## Request Limits

Add safe defaults:

```text
JSON body limit
upload size limit
header size expectations
request timeout
rate limiting for auth endpoints
rate limiting for queue polling
rate limiting for webhook ingress
```

Example:

```ts
app.use(express.json({ limit: "1mb" }));
```

If Tsonic Express bindings do not expose options cleanly yet, implement equivalent ASP.NET Core middleware once the host moves closer to .NET-native hosting.

## Secrets

Secrets must never be logged or returned.

Sensitive fields:

```text
session tokens
API credentials
webhook secrets
SSO client secrets
JWT signing keys
push tokens
```

Storage rules:

- Store token hashes, not raw tokens.
- Use timing-safe comparison for token verification.
- Rotate credentials by creating a new credential and revoking old one.
- Store push tokens hashed when lookup does not require raw token.
- Encrypt provider/client secrets at rest when possible.

## Error Handling

Production responses:

```json
{
  "result": "error",
  "code": "forbidden",
  "message": "Forbidden"
}
```

Internal logs:

```text
request_id
workspace_id when known
participant_id when known
route
action
exception stack
```

Never include secrets or raw credential values in logs.

## Audit Events

Security-relevant actions should create audit events:

```text
workspace domain added/verified/removed
auth provider changed
login success/failure threshold reached
API credential created/revoked
permission grant created/revoked
channel visibility changed
webhook created/disabled
agent endpoint created/disabled
```

Audit event creation must also be workspace-scoped and write-guarded.

## Required Tests

- Production config rejects empty JWT/root secrets.
- Production config rejects dev auth enabled.
- Development config can use dev auth only when production false.
- Error responses do not include exception text in production mode.
- Auth rate limiter blocks repeated failures.
- Secret-looking values are redacted from logs.

