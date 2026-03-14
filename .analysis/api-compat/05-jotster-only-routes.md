# Jotster-only routes

These routes exist in Jotster but do not map to an in-scope Zulip OpenAPI operation after path normalization.

| Method | Route |
| --- | --- |
| PATCH | `/api/v1/users/me/profile_data` |
| GET | `/api/v1/bots` |
| POST | `/api/v1/bots` |
| PATCH | `/api/v1/bots/:bot_id` |
| DELETE | `/api/v1/bots/:bot_id` |
| POST | `/api/v1/channel_folders` |
| DELETE | `/api/v1/channel_folders/:folder_id` |
| PATCH | `/api/v1/realm/profile_fields/:field_id` |
| DELETE | `/api/v1/realm/profile_fields/:field_id` |
| PATCH | `/api/v1/realm` |
| POST | `/api/v1/realm/deactivate` |
| GET | `/api/v1/realm/domains` |
| POST | `/api/v1/realm/domains` |
| PATCH | `/api/v1/realm/domains/:domain` |
| DELETE | `/api/v1/realm/domains/:domain` |
| GET | `/api/v1/realm/icon` |
| POST | `/api/v1/realm/icon` |
| DELETE | `/api/v1/realm/icon` |
| GET | `/api/v1/realm/logo` |
| POST | `/api/v1/realm/logo` |
| DELETE | `/api/v1/realm/logo` |
| DELETE | `/api/v1/user_groups/:group_id/members` |
| DELETE | `/api/v1/user_groups/:group_id/subgroups` |
| POST | `/api/v1/external/slack_incoming` |
| POST | `/api/v1/external/:integration_name` |
| GET | `/api/v1/bot_storage` |
| PUT | `/api/v1/bot_storage` |
| DELETE | `/api/v1/bot_storage` |
| POST | `/api/v1/submessage` |
| DELETE | `/api/v1/export/realm/:export_id` |
| PATCH | `/api/v1/navigation_views/:fragment_head/:fragment_tail` |
| DELETE | `/api/v1/navigation_views/:fragment_head/:fragment_tail` |
| POST | `/internal/admin/tenants` |
| GET | `/internal/admin/tenants` |
| PATCH | `/internal/admin/tenants/:tenant_id` |
