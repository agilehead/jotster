# Endpoint matrix

| Method | Path | Tag | Status | Jotster route | Direct test refs |
| --- | --- | --- | --- | --- | --- |
| POST | `/fetch_api_key` | authentication | Implemented + directly test-covered | `/api/v1/fetch_api_key` | `tests/tests/auth/fetch-api-key.test.ts`<br>`tests/tests/auth/fetch-api-key.test.ts`<br>`tests/tests/auth/fetch-api-key.test.ts` |
| POST | `/jwt/fetch_api_key` | authentication | Implemented + directly test-covered | `/api/v1/jwt/fetch_api_key` | `tests/tests/auth/auth-compat.test.ts` |
| POST | `/dev_fetch_api_key` | authentication | Implemented route only | `/api/v1/dev_fetch_api_key` |  |
| GET | `/dev_list_users` | authentication | Implemented + directly test-covered | `/api/v1/dev_list_users` | `tests/tests/auth/auth-compat.test.ts` |
| GET | `/events` | real_time_events | Implemented + directly test-covered | `/api/v1/events` | `tests/tests/events/get-events.test.ts`<br>`tests/tests/events/get-events.test.ts`<br>`tests/tests/events/get-events.test.ts` |
| DELETE | `/events` | real_time_events | Implemented + directly test-covered | `/api/v1/events` | `tests/tests/events/register-queue.test.ts`<br>`tests/tests/events/register-queue.test.ts` |
| GET | `/get_stream_id` | channels | Implemented + directly test-covered | `/api/v1/get_stream_id` | `tests/tests/channels/get-channels.test.ts`<br>`tests/tests/channels/get-channels.test.ts` |
| POST | `/mark_all_as_read` | messages | Implemented + directly test-covered | `/api/v1/mark_all_as_read` | `tests/tests/messages/message-flags.test.ts` |
| POST | `/mark_stream_as_read` | messages | Implemented + directly test-covered | `/api/v1/mark_stream_as_read` | `tests/tests/messages/message-compat.test.ts` |
| POST | `/mark_topic_as_read` | messages | Implemented + directly test-covered | `/api/v1/mark_topic_as_read` | `tests/tests/messages/message-compat.test.ts` |
| GET | `/attachments` | users | Implemented + directly test-covered | `/api/v1/attachments` | `tests/tests/uploads/attachments.test.ts` |
| DELETE | `/attachments/{attachment_id}` | users | Implemented route only | `/api/v1/attachments/:attachment_id` |  |
| GET | `/drafts` | drafts | Implemented + directly test-covered | `/api/v1/drafts` | `tests/tests/drafts/drafts.test.ts`<br>`tests/tests/drafts/drafts.test.ts` |
| POST | `/drafts` | drafts | Implemented + directly test-covered | `/api/v1/drafts` | `tests/tests/drafts/drafts.test.ts`<br>`tests/tests/drafts/drafts.test.ts`<br>`tests/tests/drafts/drafts.test.ts`<br>`tests/tests/drafts/drafts.test.ts`<br>`tests/tests/drafts/drafts.test.ts` |
| PATCH | `/drafts/{draft_id}` | drafts | Implemented route only | `/api/v1/drafts/:draft_id` |  |
| DELETE | `/drafts/{draft_id}` | drafts | Implemented route only | `/api/v1/drafts/:draft_id` |  |
| GET | `/navigation_views` | navigation_views | Implemented + directly test-covered | `/api/v1/navigation_views` | `tests/tests/persisted/persisted-compat.test.ts` |
| POST | `/navigation_views` | navigation_views | Implemented + directly test-covered | `/api/v1/navigation_views` | `tests/tests/persisted/persisted-compat.test.ts` |
| PATCH | `/navigation_views/{fragment}` | navigation_views | Implemented route only | `/api/v1/navigation_views/*` |  |
| DELETE | `/navigation_views/{fragment}` | navigation_views | Implemented route only | `/api/v1/navigation_views/*` |  |
| GET | `/saved_snippets` | drafts | Implemented + directly test-covered | `/api/v1/saved_snippets` | `tests/tests/persisted/persisted-compat.test.ts` |
| POST | `/saved_snippets` | drafts | Implemented + directly test-covered | `/api/v1/saved_snippets` | `tests/tests/persisted/persisted-compat.test.ts` |
| PATCH | `/saved_snippets/{saved_snippet_id}` | drafts | Implemented route only | `/api/v1/saved_snippets/:saved_snippet_id` |  |
| DELETE | `/saved_snippets/{saved_snippet_id}` | drafts | Implemented route only | `/api/v1/saved_snippets/:saved_snippet_id` |  |
| GET | `/reminders` | reminders | Implemented + directly test-covered | `/api/v1/reminders` | `tests/tests/persisted/persisted-compat.test.ts` |
| POST | `/reminders` | reminders | Implemented + directly test-covered | `/api/v1/reminders` | `tests/tests/persisted/persisted-compat.test.ts` |
| DELETE | `/reminders/{reminder_id}` | reminders | Implemented route only | `/api/v1/reminders/:reminder_id` |  |
| GET | `/scheduled_messages` | scheduled_messages | Implemented + directly test-covered | `/api/v1/scheduled_messages` | `tests/tests/persisted/persisted-compat.test.ts` |
| POST | `/scheduled_messages` | scheduled_messages | Implemented + directly test-covered | `/api/v1/scheduled_messages` | `tests/tests/persisted/persisted-compat.test.ts` |
| PATCH | `/scheduled_messages/{scheduled_message_id}` | scheduled_messages | Implemented route only | `/api/v1/scheduled_messages/:scheduled_message_id` |  |
| DELETE | `/scheduled_messages/{scheduled_message_id}` | scheduled_messages | Implemented route only | `/api/v1/scheduled_messages/:scheduled_message_id` |  |
| POST | `/default_streams` | channels | Implemented route only | `/api/v1/default_streams` |  |
| DELETE | `/default_streams` | channels | Implemented route only | `/api/v1/default_streams` |  |
| GET | `/messages` | messages | Implemented + directly test-covered | `/api/v1/messages` | `tests/tests/messages/get-messages.test.ts`<br>`tests/tests/messages/get-messages.test.ts`<br>`tests/tests/messages/get-messages.test.ts` |
| POST | `/messages` | messages | Implemented + directly test-covered | `/api/v1/messages` | `tests/tests/events/get-events.test.ts`<br>`tests/tests/messages/send-message.test.ts`<br>`tests/tests/messages/send-message.test.ts`<br>`tests/tests/messages/send-message.test.ts`<br>`tests/tests/messages/send-message.test.ts` |
| GET | `/messages/{message_id}/history` | messages | Implemented route only | `/api/v1/messages/:message_id/history` |  |
| POST | `/messages/flags` | messages | Implemented + directly test-covered | `/api/v1/messages/flags` | `tests/tests/messages/message-flags.test.ts`<br>`tests/tests/messages/message-flags.test.ts`<br>`tests/tests/messages/message-flags.test.ts`<br>`tests/tests/messages/message-flags.test.ts` |
| POST | `/messages/flags/narrow` | messages | Implemented + directly test-covered | `/api/v1/messages/flags/narrow` | `tests/tests/messages/message-compat.test.ts` |
| POST | `/messages/render` | messages | Implemented route only | `/api/v1/messages/render` |  |
| POST | `/messages/{message_id}/reactions` | messages | Implemented route only | `/api/v1/messages/:message_id/reactions` |  |
| DELETE | `/messages/{message_id}/reactions` | messages | Implemented route only | `/api/v1/messages/:message_id/reactions` |  |
| GET | `/messages/{message_id}/read_receipts` | messages | Implemented route only | `/api/v1/messages/:message_id/read_receipts` |  |
| GET | `/messages/matches_narrow` | messages | Implemented + directly test-covered | `/api/v1/messages/matches_narrow` | `tests/tests/messages/message-compat.test.ts` |
| GET | `/messages/{message_id}` | messages | Implemented route only | `/api/v1/messages/:message_id` |  |
| PATCH | `/messages/{message_id}` | messages | Implemented route only | `/api/v1/messages/:message_id` |  |
| DELETE | `/messages/{message_id}` | messages | Implemented route only | `/api/v1/messages/:message_id` |  |
| POST | `/messages/{message_id}/report` | messages | Implemented route only | `/api/v1/messages/:message_id/report` |  |
| POST | `/user_uploads` | messages | Implemented + directly test-covered | `/api/v1/user_uploads` | `tests/tests/uploads/attachments.test.ts` |
| GET | `/thumbnail/status/{realm_id_str}/{filename}` | messages | Implemented route only | `/thumbnail/status/:realm_id_str/*`<br>`/thumbnail/status/:realm_id_str/:path_id` |  |
| GET | `/user_uploads/{realm_id_str}/{filename}` | messages | Implemented route only | `/user_uploads/:tenant_id/*`<br>`/user_uploads/:tenant_id/:path_id` |  |
| GET | `/users` | users | Implemented + directly test-covered | `/api/v1/users` | `tests/tests/users/get-users.test.ts`<br>`tests/tests/users/get-users.test.ts` |
| POST | `/users` | users | Implemented + directly test-covered | `/api/v1/users` | `tests/tests/users/create-user.test.ts`<br>`tests/tests/users/create-user.test.ts`<br>`tests/tests/users/create-user.test.ts`<br>`tests/tests/users/create-user.test.ts` |
| POST | `/users/{user_id}/reactivate` | users | Implemented route only | `/api/v1/users/:user_id/reactivate` |  |
| POST | `/users/{user_id}/status` | users | Implemented route only | `/api/v1/users/:user_id/status` |  |
| GET | `/users/{user_id}/status` | users | Implemented route only | `/api/v1/users/:user_id/status` |  |
| GET | `/users/{user_id_or_email}/presence` | users | Implemented route only | `/api/v1/users/:user_id_or_email/presence` |  |
| GET | `/users/me` | users | Implemented + directly test-covered | `/api/v1/users/me` | `tests/tests/users/get-users.test.ts` |
| DELETE | `/users/me` | users | Implemented + directly test-covered | `/api/v1/users/me` | `tests/tests/users/deactivate-user.test.ts` |
| POST | `/users/me/api_key/regenerate` | users | Implemented route only | `/api/v1/users/me/api_key/regenerate` |  |
| GET | `/users/me/alert_words` | users | Implemented + directly test-covered | `/api/v1/users/me/alert_words` | `tests/tests/users/alert-words.test.ts`<br>`tests/tests/users/alert-words.test.ts` |
| POST | `/users/me/alert_words` | users | Implemented + directly test-covered | `/api/v1/users/me/alert_words` | `tests/tests/users/alert-words.test.ts`<br>`tests/tests/users/alert-words.test.ts`<br>`tests/tests/users/alert-words.test.ts`<br>`tests/tests/users/alert-words.test.ts` |
| DELETE | `/users/me/alert_words` | users | Implemented + directly test-covered | `/api/v1/users/me/alert_words` | `tests/tests/users/alert-words.test.ts`<br>`tests/tests/users/alert-words.test.ts` |
| POST | `/users/me/presence` | users | Implemented + directly test-covered | `/api/v1/users/me/presence` | `tests/tests/presence/presence.test.ts`<br>`tests/tests/presence/presence.test.ts`<br>`tests/tests/presence/presence.test.ts`<br>`tests/tests/presence/presence.test.ts`<br>`tests/tests/presence/presence.test.ts`<br>`tests/tests/presence/presence.test.ts` |
| POST | `/users/me/status` | users | Implemented + directly test-covered | `/api/v1/users/me/status` | `tests/tests/presence/user-status.test.ts`<br>`tests/tests/presence/user-status.test.ts`<br>`tests/tests/presence/user-status.test.ts`<br>`tests/tests/presence/user-status.test.ts`<br>`tests/tests/presence/user-status.test.ts` |
| GET | `/users/me/{stream_id}/topics` | channels | Implemented route only | `/api/v1/users/me/:stream_id/topics` |  |
| GET | `/users/me/subscriptions` | channels | Implemented + directly test-covered | `/api/v1/users/me/subscriptions` | `tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/unsubscribe.test.ts` |
| POST | `/users/me/subscriptions` | channels | Implemented + directly test-covered | `/api/v1/users/me/subscriptions` | `tests/tests/channels/create-channel.test.ts`<br>`tests/tests/channels/create-channel.test.ts`<br>`tests/tests/channels/create-channel.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/subscribe.test.ts`<br>`tests/tests/subscriptions/unsubscribe.test.ts`<br>`tests/tests/subscriptions/unsubscribe.test.ts` |
| PATCH | `/users/me/subscriptions` | channels | Implemented route only | `/api/v1/users/me/subscriptions` |  |
| DELETE | `/users/me/subscriptions` | channels | Implemented + directly test-covered | `/api/v1/users/me/subscriptions` | `tests/tests/subscriptions/unsubscribe.test.ts`<br>`tests/tests/subscriptions/unsubscribe.test.ts`<br>`tests/tests/subscriptions/unsubscribe.test.ts` |
| PATCH | `/users/me/subscriptions/muted_topics` | channels | Implemented route only | `/api/v1/users/me/subscriptions/muted_topics` |  |
| POST | `/mobile_push/test_notification` | mobile | Implemented route only | `/api/v1/mobile_push/test_notification` |  |
| POST | `/mobile_push/e2ee/test_notification` | mobile | Implemented route only | `/api/v1/mobile_push/e2ee/test_notification` |  |
| POST | `/mobile_push/register` | mobile | Implemented route only | `/api/v1/mobile_push/register` |  |
| POST | `/remotes/push/e2ee/register` | mobile | Implemented + directly test-covered | `/api/v1/remotes/push/e2ee/register` | `tests/tests/push/push-compat.test.ts` |
| POST | `/register_client_device` | mobile | Implemented + directly test-covered | `/api/v1/register_client_device` | `tests/tests/push/push-compat.test.ts` |
| POST | `/remove_client_device` | mobile | Implemented + directly test-covered | `/api/v1/remove_client_device` | `tests/tests/push/push-compat.test.ts` |
| POST | `/user_topics` | channels | Implemented + directly test-covered | `/api/v1/user_topics` | `tests/tests/presence/muting.test.ts`<br>`tests/tests/presence/muting.test.ts`<br>`tests/tests/presence/muting.test.ts` |
| POST | `/users/me/muted_users/{muted_user_id}` | users | Implemented route only | `/api/v1/users/me/muted_users/:muted_user_id` |  |
| DELETE | `/users/me/muted_users/{muted_user_id}` | users | Implemented route only | `/api/v1/users/me/muted_users/:muted_user_id` |  |
| POST | `/users/me/apns_device_token` | users | Implemented + directly test-covered | `/api/v1/users/me/apns_device_token` | `tests/tests/push/push-tokens.test.ts`<br>`tests/tests/push/push-tokens.test.ts` |
| DELETE | `/users/me/apns_device_token` | users | Implemented + directly test-covered | `/api/v1/users/me/apns_device_token` | `tests/tests/push/push-tokens.test.ts` |
| POST | `/users/me/android_gcm_reg_id` | users | Implemented + directly test-covered | `/api/v1/users/me/android_gcm_reg_id` | `tests/tests/push/push-tokens.test.ts`<br>`tests/tests/push/push-tokens.test.ts` |
| DELETE | `/users/me/android_gcm_reg_id` | users | Implemented + directly test-covered | `/api/v1/users/me/android_gcm_reg_id` | `tests/tests/push/push-tokens.test.ts` |
| GET | `/users/{user_id}/subscriptions/{stream_id}` | channels | Implemented route only | `/api/v1/users/:user_id/subscriptions/:stream_id` |  |
| GET | `/users/{user_id}/channels` | channels | Implemented route only | `/api/v1/users/:user_id/channels` |  |
| POST | `/realm/emoji/{emoji_name}` | server_and_organizations | Implemented route only | `/api/v1/realm/emoji/:emoji_name` |  |
| DELETE | `/realm/emoji/{emoji_name}` | server_and_organizations | Implemented route only | `/api/v1/realm/emoji/:emoji_name` |  |
| GET | `/realm/emoji` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/emoji` | `tests/tests/emoji/custom-emoji.test.ts`<br>`tests/tests/emoji/custom-emoji.test.ts` |
| GET | `/realm/presence` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/presence` | `tests/tests/presence/presence.test.ts` |
| GET | `/realm/profile_fields` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/profile_fields` | `tests/tests/profile/custom-profile-fields.test.ts` |
| PATCH | `/realm/profile_fields` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/profile_fields` | `tests/tests/organization/organization-compat.test.ts` |
| POST | `/realm/profile_fields` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/profile_fields` | `tests/tests/organization/organization-compat.test.ts`<br>`tests/tests/organization/organization-compat.test.ts`<br>`tests/tests/profile/custom-profile-fields.test.ts`<br>`tests/tests/profile/custom-profile-fields.test.ts`<br>`tests/tests/profile/custom-profile-fields.test.ts`<br>`tests/tests/profile/custom-profile-fields.test.ts`<br>`tests/tests/profile/custom-profile-fields.test.ts` |
| PATCH | `/realm/user_settings_defaults` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/user_settings_defaults` | `tests/tests/organization/org-settings.test.ts` |
| POST | `/users/me/subscriptions/properties` | channels | Implemented + directly test-covered | `/api/v1/users/me/subscriptions/properties` | `tests/tests/subscriptions/properties.test.ts`<br>`tests/tests/subscriptions/properties.test.ts`<br>`tests/tests/subscriptions/properties.test.ts` |
| PATCH | `/users/me/subscriptions/{stream_id}` | channels | Implemented route only | `/api/v1/users/me/subscriptions/:stream_id` |  |
| GET | `/users/{email}` | users | Implemented route only | `/api/v1/users/:user_id_or_email` |  |
| PATCH | `/users/{email}` | users | Implemented route only | `/api/v1/users/:user_id_or_email` |  |
| GET | `/users/{user_id}` | users | Implemented route only | `/api/v1/users/:user_id_or_email` |  |
| PATCH | `/users/{user_id}` | users | Implemented route only | `/api/v1/users/:user_id_or_email` |  |
| DELETE | `/users/{user_id}` | users | Implemented route only | `/api/v1/users/:user_id` |  |
| GET | `/realm/linkifiers` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/linkifiers` | `tests/tests/organization/organization-compat.test.ts` |
| PATCH | `/realm/linkifiers` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/linkifiers` | `tests/tests/organization/organization-compat.test.ts` |
| POST | `/realm/filters` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/filters` | `tests/tests/organization/organization-compat.test.ts`<br>`tests/tests/organization/organization-compat.test.ts` |
| DELETE | `/realm/filters/{filter_id}` | server_and_organizations | Implemented route only | `/api/v1/realm/filters/:filter_id` |  |
| PATCH | `/realm/filters/{filter_id}` | server_and_organizations | Implemented route only | `/api/v1/realm/filters/:filter_id` |  |
| POST | `/realm/playgrounds` | server_and_organizations | Excluded by scope |  |  |
| DELETE | `/realm/playgrounds/{playground_id}` | server_and_organizations | Excluded by scope |  |  |
| GET | `/export/realm` | server_and_organizations | Implemented + directly test-covered | `/api/v1/export/realm` | `tests/tests/export/data-export.test.ts`<br>`tests/tests/export/data-export.test.ts` |
| POST | `/export/realm` | server_and_organizations | Implemented + directly test-covered | `/api/v1/export/realm` | `tests/tests/export/data-export.test.ts`<br>`tests/tests/export/data-export.test.ts` |
| GET | `/export/realm/consents` | server_and_organizations | Implemented + directly test-covered | `/api/v1/export/realm/consents` | `tests/tests/export/data-export.test.ts` |
| GET | `/invites` | invites | Implemented + directly test-covered | `/api/v1/invites` | `tests/tests/invitations/invitations.test.ts`<br>`tests/tests/invitations/invitations.test.ts` |
| POST | `/invites` | invites | Implemented + directly test-covered | `/api/v1/invites` | `tests/tests/invitations/invitations.test.ts`<br>`tests/tests/invitations/invitations.test.ts` |
| POST | `/invites/multiuse` | invites | Implemented + directly test-covered | `/api/v1/invites/multiuse` | `tests/tests/invitations/invitations.test.ts` |
| DELETE | `/invites/{invite_id}` | invites | Implemented route only | `/api/v1/invites/:invite_id` |  |
| DELETE | `/invites/multiuse/{invite_id}` | invites | Implemented route only | `/api/v1/invites/multiuse/:invite_id` |  |
| POST | `/invites/{invite_id}/resend` | invites | Implemented route only | `/api/v1/invites/:invite_id/resend` |  |
| POST | `/realm/test_welcome_bot_custom_message` | server_and_organizations | Implemented + directly test-covered | `/api/v1/realm/test_welcome_bot_custom_message` | `tests/tests/organization/organization-compat.test.ts` |
| POST | `/register` | real_time_events | Implemented + directly test-covered | `/api/v1/register` | `tests/tests/events/get-events.test.ts`<br>`tests/tests/events/get-events.test.ts`<br>`tests/tests/events/register-queue.test.ts`<br>`tests/tests/events/register-queue.test.ts`<br>`tests/tests/events/register-queue.test.ts`<br>`tests/tests/events/register-queue.test.ts`<br>`tests/tests/events/register-queue.test.ts` |
| GET | `/server_settings` | server_and_organizations | Implemented + directly test-covered | `/api/v1/server_settings` | `tests/tests/auth/server-settings.test.ts`<br>`tests/tests/auth/server-settings.test.ts`<br>`tests/tests/auth/server-settings.test.ts` |
| PATCH | `/settings` | users | Implemented + directly test-covered | `/api/v1/settings` | `tests/tests/settings/user-settings.test.ts`<br>`tests/tests/settings/user-settings.test.ts`<br>`tests/tests/settings/user-settings.test.ts` |
| GET | `/streams/{stream_id}/members` | channels | Implemented route only | `/api/v1/streams/:stream_id/members` |  |
| GET | `/streams` | channels | Implemented + directly test-covered | `/api/v1/streams` | `tests/tests/channels/get-channels.test.ts`<br>`tests/tests/channels/get-channels.test.ts` |
| GET | `/streams/{stream_id}` | channels | Implemented route only | `/api/v1/streams/:stream_id` |  |
| DELETE | `/streams/{stream_id}` | channels | Implemented route only | `/api/v1/streams/:stream_id` |  |
| PATCH | `/streams/{stream_id}` | channels | Implemented route only | `/api/v1/streams/:stream_id` |  |
| GET | `/streams/{stream_id}/email_address` | channels | Implemented route only | `/api/v1/streams/:stream_id/email_address` |  |
| POST | `/streams/{stream_id}/delete_topic` | channels | Implemented route only | `/api/v1/streams/:stream_id/delete_topic` |  |
| POST | `/typing` | users | Implemented + directly test-covered | `/api/v1/typing` | `tests/tests/presence/typing.test.ts`<br>`tests/tests/presence/typing.test.ts`<br>`tests/tests/presence/typing.test.ts`<br>`tests/tests/presence/typing.test.ts` |
| POST | `/messages/{message_id}/typing` | users | Implemented route only | `/api/v1/messages/:message_id/typing` |  |
| POST | `/channels/create` | channels | Implemented + directly test-covered | `/api/v1/channels/create` | `tests/tests/channels/create-channel.test.ts` |
| POST | `/user_groups/create` | users | Implemented + directly test-covered | `/api/v1/user_groups/create` | `tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts` |
| POST | `/user_groups/{user_group_id}/members` | users | Implemented route only | `/api/v1/user_groups/:group_id/members` |  |
| GET | `/user_groups/{user_group_id}/members` | users | Implemented route only | `/api/v1/user_groups/:group_id/members` |  |
| PATCH | `/user_groups/{user_group_id}` | users | Implemented route only | `/api/v1/user_groups/:group_id` |  |
| GET | `/user_groups` | users | Implemented + directly test-covered | `/api/v1/user_groups` | `tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts`<br>`tests/tests/users/user-groups.test.ts` |
| POST | `/user_groups/{user_group_id}/subgroups` | users | Implemented route only | `/api/v1/user_groups/:group_id/subgroups` |  |
| GET | `/user_groups/{user_group_id}/subgroups` | users | Implemented route only | `/api/v1/user_groups/:group_id/subgroups` |  |
| GET | `/user_groups/{user_group_id}/members/{user_id}` | users | Implemented route only | `/api/v1/user_groups/:group_id/members/:user_id` |  |
| POST | `/user_groups/{user_group_id}/deactivate` | users | Implemented route only | `/api/v1/user_groups/:group_id/deactivate` |  |
| POST | `/channel_folders/create` | channels | Implemented + directly test-covered | `/api/v1/channel_folders/create` | `tests/tests/channels/channel-compat.test.ts`<br>`tests/tests/channels/channel-compat.test.ts` |
| GET | `/channel_folders` | channels | Implemented + directly test-covered | `/api/v1/channel_folders` | `tests/tests/channels/channel-folders.test.ts`<br>`tests/tests/channels/channel-folders.test.ts` |
| PATCH | `/channel_folders` | channels | Implemented + directly test-covered | `/api/v1/channel_folders` | `tests/tests/channels/channel-compat.test.ts` |
| PATCH | `/channel_folders/{channel_folder_id}` | channels | Implemented route only | `/api/v1/channel_folders/:folder_id` |  |
| GET | `/bots/{bot_id}/api_key` | users | Implemented route only | `/api/v1/bots/:bot_id/api_key` |  |
| POST | `/bots/{bot_id}/api_key/regenerate` | users | Implemented route only | `/api/v1/bots/:bot_id/api_key/regenerate` |  |
| POST | `/real-time` | real_time_events | Implemented + directly test-covered | `/api/v1/real-time` | `tests/tests/webhooks/webhook-compat.test.ts` |
| POST | `/rest-error-handling` | real_time_events | Implemented + directly test-covered | `/api/v1/rest-error-handling` | `tests/tests/webhooks/webhook-compat.test.ts` |
| POST | `/zulip-outgoing-webhook` | webhooks | Implemented + directly test-covered | `/api/v1/zulip-outgoing-webhook` | `tests/tests/webhooks/webhook-compat.test.ts` |
| GET | `/calls/bigbluebutton/create` | channels | Excluded by scope |  |  |
| POST | `/calls/nextcloud_talk/create` | channels | Excluded by scope |  |  |
| POST | `/calls/constructorgroups/create` | channels | Excluded by scope |  |  |
