# Methodology

## Sources of truth

- Zulip OpenAPI: `/home/jester/temp/zulip/zerver/openapi/zulip.yaml`
- Jotster routes: `packages/server/src/routes/register-routes.ts`
- Jotster direct test references: `tests/**/*.ts`
- Report generator: `scripts/generate-api-compat-report.mjs`

## Matching rules

- Compared by HTTP method and normalized path shape.
- Normalization treats:
  - Jotster `:param` and Zulip `{param}` as equivalent placeholders
  - Jotster wildcard tails like `/*` as a placeholder segment
- For standard Zulip API operations, comparison uses the `/api/v1`-prefixed Jotster path.
- For raw file routes such as `/thumbnail/...` and `/user_uploads/...`, comparison uses the raw path.
- Direct test coverage is derived from explicit endpoint references in test titles and assertions, using OpenAPI-style placeholder paths where needed.

## Status meanings

- `Implemented + directly test-covered`: matching Jotster route exists and a direct test-path reference exists
- `Implemented route only`: matching route exists but this inventory did not find a direct test-path reference
- `Excluded by scope`: intentionally excluded from this compatibility wave
- `Missing`: no matching Jotster route exists

## Scope exclusions

This wave intentionally excludes:

- code playground endpoints
- video-call provider endpoints

Those excluded operations remain listed in the matrix so the omission is explicit.

## Limits

This is still a route-and-test inventory, not a full schema-proof. It proves that every in-scope operation has both a matching Jotster route and at least one direct endpoint-level test reference. It does not, by itself, prove exact Zulip parity for every request shape, response schema, permission branch, or error message.
