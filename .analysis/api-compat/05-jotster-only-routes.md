# Jotster-only routes

These routes exist in Jotster but do not map to a Zulip OpenAPI operation after path normalization.

| Method | Route |
| --- | --- |
| DELETE | `/api/v1/bot_storage` |
| DELETE | `/api/v1/bots/:bot_id` |
| DELETE | `/api/v1/channel_folders/:folder_id` |
| DELETE | `/api/v1/export/realm/:export_id` |
| DELETE | `/api/v1/navigation_views/:fragment_head/:fragment_tail` |
| DELETE | `/api/v1/realm/domains/:domain` |
| DELETE | `/api/v1/realm/icon` |
| DELETE | `/api/v1/realm/logo` |
| DELETE | `/api/v1/realm/profile_fields/:field_id` |
| DELETE | `/api/v1/user_groups/:group_id/members` |
| DELETE | `/api/v1/user_groups/:group_id/subgroups` |
| GET | `/api/v1/bot_storage` |
| GET | `/api/v1/bots` |
| GET | `/api/v1/realm/domains` |
| GET | `/api/v1/realm/icon` |
| GET | `/api/v1/realm/logo` |
| GET | `/internal/admin/tenants` |
| PATCH | `/api/v1/bots/:bot_id` |
| PATCH | `/api/v1/navigation_views/:fragment_head/:fragment_tail` |
| PATCH | `/api/v1/realm` |
| PATCH | `/api/v1/realm/domains/:domain` |
| PATCH | `/api/v1/realm/profile_fields/:field_id` |
| PATCH | `/api/v1/users/me/profile_data` |
| PATCH | `/internal/admin/tenants/:tenant_id` |
| POST | `/api/v1/bots` |
| POST | `/api/v1/channel_folders` |
| POST | `/api/v1/external/:integration_name` |
| POST | `/api/v1/external/slack_incoming` |
| POST | `/api/v1/realm/deactivate` |
| POST | `/api/v1/realm/domains` |
| POST | `/api/v1/realm/icon` |
| POST | `/api/v1/realm/logo` |
| POST | `/api/v1/submessage` |
| POST | `/internal/admin/tenants` |
| PUT | `/api/v1/bot_storage` |
