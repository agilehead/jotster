# Jotster routes not present in Zulip OpenAPI

Total Jotster-only routes after removing parameter-name aliases: **33**

These routes are not evidence of Zulip compatibility. They are either:

- Jotster-specific product extensions
- internal/admin endpoints
- endpoints that overlap a Zulip feature area but use a different canonical path

## `/api/v1/bot_storage`

- `DELETE /api/v1/bot_storage`
- `GET /api/v1/bot_storage`
- `PUT /api/v1/bot_storage`

## `/api/v1/bots`

- `GET /api/v1/bots`
- `POST /api/v1/bots`
- `DELETE /api/v1/bots/:bot_id`
- `PATCH /api/v1/bots/:bot_id`

## `/api/v1/channel_folders`

- `POST /api/v1/channel_folders`
- `DELETE /api/v1/channel_folders/:folder_id`

## `/api/v1/export`

- `DELETE /api/v1/export/realm/:export_id`

## `/api/v1/external`

- `POST /api/v1/external/:integration_name`
- `POST /api/v1/external/slack_incoming`

## `/api/v1/realm`

- `PATCH /api/v1/realm`
- `POST /api/v1/realm/deactivate`
- `GET /api/v1/realm/domains`
- `POST /api/v1/realm/domains`
- `DELETE /api/v1/realm/domains/:domain`
- `PATCH /api/v1/realm/domains/:domain`
- `DELETE /api/v1/realm/icon`
- `GET /api/v1/realm/icon`
- `POST /api/v1/realm/icon`
- `DELETE /api/v1/realm/logo`
- `GET /api/v1/realm/logo`
- `POST /api/v1/realm/logo`
- `DELETE /api/v1/realm/profile_fields/:field_id`
- `PATCH /api/v1/realm/profile_fields/:field_id`

## `/api/v1/submessage`

- `POST /api/v1/submessage`

## `/api/v1/user_groups`

- `DELETE /api/v1/user_groups/:group_id/members`
- `DELETE /api/v1/user_groups/:group_id/subgroups`

## `/api/v1/users`

- `PATCH /api/v1/users/me/profile_data`

## `/internal`

- `GET /internal/admin/tenants`
- `POST /internal/admin/tenants`
- `PATCH /internal/admin/tenants/:tenant_id`

