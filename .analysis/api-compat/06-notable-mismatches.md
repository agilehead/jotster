# Notable semantic and path mismatches

This file captures the cases where simple route inventory is **not enough** to claim real Zulip API compatibility.

## 1. User-group member mutation is only partially compatible

Zulip OpenAPI:

- `POST /user_groups/{user_group_id}/members`

Zulip expects this single endpoint to support a richer update contract:

- `add`
- `delete`
- `add_subgroups`
- `delete_subgroups`

Jotster currently splits this behavior across multiple endpoints:

- `POST /api/v1/user_groups/:group_id/members`
- `DELETE /api/v1/user_groups/:group_id/members`

Evidence:

- `packages/server/src/handlers/handle-add-user-group-members.ts:1`
- `packages/server/src/handlers/handle-remove-user-group-members.ts:1`

What Jotster does today:

- `POST` requires `add`
- `DELETE` requires `delete`

Why this matters:

- route presence alone makes the Zulip `POST` endpoint look implemented
- but the Zulip contract is broader than Jotster’s current `POST` handler
- this is **partial compatibility**, not full compatibility

## 2. User-group subgroup mutation is only partially compatible

Zulip OpenAPI:

- `POST /user_groups/{user_group_id}/subgroups`

Zulip expects a single endpoint supporting both:

- `add`
- `delete`

Jotster currently splits this behavior:

- `POST /api/v1/user_groups/:group_id/subgroups`
- `DELETE /api/v1/user_groups/:group_id/subgroups`

Evidence:

- `packages/server/src/handlers/handle-add-user-group-subgroups.ts:1`
- `packages/server/src/handlers/handle-remove-user-group-subgroups.ts:1`

Why this matters:

- route-shape comparison alone makes the Zulip `POST` look implemented
- actual request semantics diverge

## 3. User-group update semantics are narrower than Zulip

Zulip OpenAPI:

- `PATCH /user_groups/{user_group_id}`

Zulip supports structured group-setting update payloads such as:

- `can_add_members_group`
- `can_join_group`
- `can_leave_group`
- `can_manage_group`
- `can_mention_group`
- `can_remove_members_group`
- `deactivated`

Those are documented as structured group-setting value updates, not simple scalar IDs.

Jotster currently accepts a much simpler shape:

- plain optional strings for `name` / `description`
- plain group ID strings for permission fields

Evidence:

- `packages/server/src/handlers/handle-update-user-group.ts:1`
- `packages/permissions/src/domain/update-user-group-domain.ts:1`

Why this matters:

- the path is close enough to look compatible at a route-inventory level
- but the payload contract is not Zulip-compatible yet

## 4. Channel-folder create path is noncanonical

Zulip OpenAPI:

- `POST /channel_folders/create`

Jotster route:

- `POST /api/v1/channel_folders`

Evidence:

- Zulip: `/home/jester/temp/zulip/zerver/openapi/zulip.yaml`
- Jotster: `packages/server/src/routes/register-routes.ts:386`

Why this matters:

- the feature exists in Jotster
- but clients written against Zulip OpenAPI will call a different path
- this is a compatibility gap, not just a naming issue

## 5. Channel-folder reorder is missing entirely

Zulip OpenAPI:

- `PATCH /channel_folders`

Jotster:

- no matching reorder endpoint

Jotster does have:

- `PATCH /api/v1/channel_folders/:folder_id`
- `DELETE /api/v1/channel_folders/:folder_id`

but those are different operations.

## 6. Upload file access path is shape-compatible with parameter-name differences

Zulip OpenAPI:

- `GET /user_uploads/{realm_id_str}/{filename}`

Jotster route:

- `GET /user_uploads/:tenant_id/:path_id`

This one appears genuinely close:

- same method
- same literal path shape
- only placeholder names differ

Evidence:

- `packages/server/src/routes/register-routes.ts:660`

This is one of the few parameter-name-only differences that is reasonable to treat as compatible at the route level.

## 7. Jotster has extra bot CRUD routes, but Zulip bot API-key routes are still missing

Jotster currently exposes:

- `GET /api/v1/bots`
- `POST /api/v1/bots`
- `PATCH /api/v1/bots/:bot_id`
- `DELETE /api/v1/bots/:bot_id`

But Zulip OpenAPI specifically includes:

- `GET /bots/{bot_id}/api_key`
- `POST /bots/{bot_id}/api_key/regenerate`

Those are currently missing from Jotster.

Why this matters:

- having extra bot-management routes does **not** imply compatibility with the specific Zulip bot API-key operations

## 8. Internal admin tenant APIs are Jotster-specific

Jotster exposes:

- `POST /internal/admin/tenants`
- `GET /internal/admin/tenants`
- `PATCH /internal/admin/tenants/:tenant_id`

These are not in Zulip OpenAPI and should be treated as Jotster-specific administration APIs, not compatibility work.
