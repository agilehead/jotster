# Methodology

## Source of truth

- Zulip API source of truth: `/home/jester/temp/zulip/zerver/openapi/zulip.yaml`
- Jotster route source of truth: `packages/server/src/routes/register-routes.ts`
- Jotster automated API coverage signal: `tests/**/*.ts`

## What was compared

For each Zulip OpenAPI operation, this report compares:

- HTTP method
- path template
- presence of a matching Jotster route
- whether Jotster has a direct automated test reference for that endpoint path

## Status meanings

- `Implemented + directly test-covered`
  - Exact method/path match exists in Jotster, and the endpoint path appears directly in the Jotster test suite.
- `Implemented route only`
  - Exact method/path match exists in Jotster, but this inventory did not find a direct test-path reference.
- `Implemented with parameter-name/path-template differences`
  - Jotster has the same route shape and method, but with different parameter names in the path template.
  - Example: Zulip `/user_groups/{user_group_id}/members` vs Jotster `/api/v1/user_groups/:group_id/members`.
- `Missing`
  - No matching Jotster route was found.

## Important limits

This is a route inventory and compatibility audit, not a full schema-by-schema proof.

It does **not** claim that every implemented endpoint is fully Zulip-compatible for:

- request parameter validation
- exact response schema
- exact error codes/messages
- feature-level or versioned behavior details

The direct test coverage column is also a **lower bound**:

- it only marks endpoints whose path strings are directly referenced in tests
- helper-driven coverage or indirect coverage may not be recognized here

## Manual normalization rules

A small number of endpoints were classified as compatible despite parameter-name differences only:

- `/channel_folders/{channel_folder_id}` ↔ `/api/v1/channel_folders/:folder_id`
- `/user_groups/{user_group_id}/...` ↔ `/api/v1/user_groups/:group_id/...`
- `/user_uploads/{realm_id_str}/{filename}` ↔ `/user_uploads/:tenant_id/:path_id`

These were treated as compatible because the route shape and semantics align; only the placeholder names differ.
