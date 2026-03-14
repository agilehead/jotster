# Exhaustive Zulip operation matrix

This file covers all **151** operations in `zulip.yaml`.

## `authentication`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented route only | `POST` | `/dev_fetch_api_key` | `dev-fetch-api-key` | `/api/v1/dev_fetch_api_key` | 0 | Fetch an API key (development only) |
| Missing | `GET` | `/dev_list_users` | `dev-list-users` | `` | 0 | List users (development only) |
| Implemented + directly test-covered | `POST` | `/fetch_api_key` | `fetch-api-key` | `/api/v1/fetch_api_key` | 3 | Fetch an API key (production) |
| Missing | `POST` | `/jwt/fetch_api_key` | `jwt-fetch-api-key` | `` | 0 | Fetch an API key (JWT) |

## `channels`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Missing | `GET` | `/calls/bigbluebutton/create` | `create-big-blue-button-video-call` | `` | 0 | Create BigBlueButton video call |
| Missing | `POST` | `/calls/constructorgroups/create` | `create-constructor-groups-video-call` | `` | 0 | Create Constructor Groups video call |
| Missing | `POST` | `/calls/nextcloud_talk/create` | `create-nextcloud-talk-video-call` | `` | 0 | Create Nextcloud Talk video call |
| Implemented + directly test-covered | `GET` | `/channel_folders` | `get-channel-folders` | `/api/v1/channel_folders` | 6 | Get channel folders |
| Missing | `PATCH` | `/channel_folders` | `patch-channel-folders` | `` | 0 | Reorder channel folders |
| Missing | `POST` | `/channel_folders/create` | `create-channel-folder` | `` | 0 | Create a channel folder |
| Implemented with parameter-name/path-template differences | `PATCH` | `/channel_folders/{channel_folder_id}` | `update-channel-folder` | `/api/v1/channel_folders/:folder_id` | 0 | Update a channel folder |
| Implemented + directly test-covered | `POST` | `/channels/create` | `create-channel` | `/api/v1/channels/create` | 1 | Create a channel |
| Implemented route only | `DELETE` | `/default_streams` | `remove-default-stream` | `/api/v1/default_streams` | 0 | Remove a default channel |
| Implemented route only | `POST` | `/default_streams` | `add-default-stream` | `/api/v1/default_streams` | 0 | Add a default channel |
| Implemented + directly test-covered | `GET` | `/get_stream_id` | `get-stream-id` | `/api/v1/get_stream_id` | 2 | Get channel ID |
| Implemented + directly test-covered | `GET` | `/streams` | `get-streams` | `/api/v1/streams` | 2 | Get all channels |
| Implemented route only | `DELETE` | `/streams/{stream_id}` | `archive-stream` | `/api/v1/streams/:stream_id` | 0 | Archive a channel |
| Implemented route only | `GET` | `/streams/{stream_id}` | `get-stream-by-id` | `/api/v1/streams/:stream_id` | 0 | Get a channel by ID |
| Implemented route only | `PATCH` | `/streams/{stream_id}` | `update-stream` | `/api/v1/streams/:stream_id` | 0 | Update a channel |
| Missing | `POST` | `/streams/{stream_id}/delete_topic` | `delete-topic` | `` | 0 | Delete a topic |
| Missing | `GET` | `/streams/{stream_id}/email_address` | `get-stream-email-address` | `` | 0 | Get channel's email address |
| Implemented route only | `GET` | `/streams/{stream_id}/members` | `get-subscribers` | `/api/v1/streams/:stream_id/members` | 0 | Get channel subscribers |
| Implemented + directly test-covered | `POST` | `/user_topics` | `update-user-topic` | `/api/v1/user_topics` | 3 | Update personal preferences for a topic |
| Implemented + directly test-covered | `DELETE` | `/users/me/subscriptions` | `unsubscribe` | `/api/v1/users/me/subscriptions` | 16 | Unsubscribe from a channel |
| Implemented + directly test-covered | `GET` | `/users/me/subscriptions` | `get-subscriptions` | `/api/v1/users/me/subscriptions` | 16 | Get subscribed channels |
| Implemented + directly test-covered | `PATCH` | `/users/me/subscriptions` | `update-subscriptions` | `/api/v1/users/me/subscriptions` | 16 | Update subscriptions |
| Implemented + directly test-covered | `POST` | `/users/me/subscriptions` | `subscribe` | `/api/v1/users/me/subscriptions` | 16 | Subscribe to a channel |
| Implemented route only | `PATCH` | `/users/me/subscriptions/muted_topics` | `mute-topic` | `/api/v1/users/me/subscriptions/muted_topics` | 0 | Topic muting |
| Implemented + directly test-covered | `POST` | `/users/me/subscriptions/properties` | `update-subscription-settings` | `/api/v1/users/me/subscriptions/properties` | 3 | Bulk update subscription settings |
| Implemented route only | `PATCH` | `/users/me/subscriptions/{stream_id}` | `update-subscription-property` | `/api/v1/users/me/subscriptions/:stream_id` | 0 | Update a subscription setting |
| Implemented route only | `GET` | `/users/me/{stream_id}/topics` | `get-stream-topics` | `/api/v1/users/me/:stream_id/topics` | 0 | Get topics in a channel |
| Implemented route only | `GET` | `/users/{user_id}/channels` | `get-user-channels` | `/api/v1/users/:user_id/channels` | 0 | Get a user's subscribed channels |
| Implemented route only | `GET` | `/users/{user_id}/subscriptions/{stream_id}` | `get-subscription-status` | `/api/v1/users/:user_id/subscriptions/:stream_id` | 0 | Get subscription status |

## `drafts`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `GET` | `/drafts` | `get-drafts` | `/api/v1/drafts` | 7 | Get drafts |
| Implemented + directly test-covered | `POST` | `/drafts` | `create-drafts` | `/api/v1/drafts` | 7 | Create drafts |
| Implemented route only | `DELETE` | `/drafts/{draft_id}` | `delete-draft` | `/api/v1/drafts/:draft_id` | 0 | Delete a draft |
| Implemented route only | `PATCH` | `/drafts/{draft_id}` | `edit-draft` | `/api/v1/drafts/:draft_id` | 0 | Edit a draft |
| Missing | `GET` | `/saved_snippets` | `get-saved-snippets` | `` | 0 | Get all saved snippets |
| Missing | `POST` | `/saved_snippets` | `create-saved-snippet` | `` | 0 | Create a saved snippet |
| Missing | `DELETE` | `/saved_snippets/{saved_snippet_id}` | `delete-saved-snippet` | `` | 0 | Delete a saved snippet |
| Missing | `PATCH` | `/saved_snippets/{saved_snippet_id}` | `edit-saved-snippet` | `` | 0 | Edit a saved snippet |

## `invites`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `GET` | `/invites` | `get-invites` | `/api/v1/invites` | 4 | Get all invitations |
| Implemented + directly test-covered | `POST` | `/invites` | `send-invites` | `/api/v1/invites` | 4 | Send invitations |
| Implemented + directly test-covered | `POST` | `/invites/multiuse` | `create-invite-link` | `/api/v1/invites/multiuse` | 1 | Create a reusable invitation link |
| Implemented route only | `DELETE` | `/invites/multiuse/{invite_id}` | `revoke-invite-link` | `/api/v1/invites/multiuse/:invite_id` | 0 | Revoke a reusable invitation link |
| Implemented route only | `DELETE` | `/invites/{invite_id}` | `revoke-email-invite` | `/api/v1/invites/:invite_id` | 0 | Revoke an email invitation |
| Implemented route only | `POST` | `/invites/{invite_id}/resend` | `resend-email-invite` | `/api/v1/invites/:invite_id/resend` | 0 | Resend an email invitation |

## `messages`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `POST` | `/mark_all_as_read` | `mark-all-as-read` | `/api/v1/mark_all_as_read` | 1 | Mark all messages as read |
| Missing | `POST` | `/mark_stream_as_read` | `mark-stream-as-read` | `` | 0 | Mark messages in a channel as read |
| Missing | `POST` | `/mark_topic_as_read` | `mark-topic-as-read` | `` | 0 | Mark messages in a topic as read |
| Implemented + directly test-covered | `GET` | `/messages` | `get-messages` | `/api/v1/messages` | 8 | Get messages |
| Implemented + directly test-covered | `POST` | `/messages` | `send-message` | `/api/v1/messages` | 8 | Send a message |
| Implemented + directly test-covered | `POST` | `/messages/flags` | `update-message-flags` | `/api/v1/messages/flags` | 4 | Update personal message flags |
| Missing | `POST` | `/messages/flags/narrow` | `update-message-flags-for-narrow` | `` | 0 | Update personal message flags for narrow |
| Missing | `GET` | `/messages/matches_narrow` | `check-messages-match-narrow` | `` | 0 | Check if messages match a narrow |
| Implemented route only | `POST` | `/messages/render` | `render-message` | `/api/v1/messages/render` | 0 | Render a message |
| Implemented route only | `DELETE` | `/messages/{message_id}` | `delete-message` | `/api/v1/messages/:message_id` | 0 | Delete a message |
| Implemented route only | `GET` | `/messages/{message_id}` | `get-message` | `/api/v1/messages/:message_id` | 0 | Fetch a single message |
| Implemented route only | `PATCH` | `/messages/{message_id}` | `update-message` | `/api/v1/messages/:message_id` | 0 | Edit a message |
| Implemented route only | `GET` | `/messages/{message_id}/history` | `get-message-history` | `/api/v1/messages/:message_id/history` | 0 | Get a message's edit history |
| Implemented route only | `DELETE` | `/messages/{message_id}/reactions` | `remove-reaction` | `/api/v1/messages/:message_id/reactions` | 0 | Remove an emoji reaction |
| Implemented route only | `POST` | `/messages/{message_id}/reactions` | `add-reaction` | `/api/v1/messages/:message_id/reactions` | 0 | Add an emoji reaction |
| Implemented route only | `GET` | `/messages/{message_id}/read_receipts` | `get-read-receipts` | `/api/v1/messages/:message_id/read_receipts` | 0 | Get a message's read receipts |
| Missing | `POST` | `/messages/{message_id}/report` | `report-message` | `` | 0 | Report a message |
| Missing | `GET` | `/thumbnail/status/{realm_id_str}/{filename}` | `check-thumbnail-status` | `` | 0 | Check thumbnail status |
| Implemented + directly test-covered | `POST` | `/user_uploads` | `upload-file` | `/api/v1/user_uploads` | 1 | Upload a file |
| Implemented with parameter-name/path-template differences | `GET` | `/user_uploads/{realm_id_str}/{filename}` | `get-file-temporary-url` | `/user_uploads/:tenant_id/:path_id` | 0 | Get public temporary URL for an uploaded file |

## `mobile`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented route only | `POST` | `/mobile_push/e2ee/test_notification` | `e2ee-test-notify` | `/api/v1/mobile_push/e2ee/test_notification` | 0 | Send an E2EE test notification to mobile device(s) |
| Implemented route only | `POST` | `/mobile_push/register` | `register-push-device` | `/api/v1/mobile_push/register` | 0 | Register E2EE push device |
| Implemented route only | `POST` | `/mobile_push/test_notification` | `test-notify` | `/api/v1/mobile_push/test_notification` | 0 | Send a test notification to mobile device(s) |
| Missing | `POST` | `/register_client_device` | `register-client-device` | `` | 0 | Register a logged-in device |
| Missing | `POST` | `/remotes/push/e2ee/register` | `register-remote-push-device` | `` | 0 | Register E2EE push device to bouncer |
| Missing | `POST` | `/remove_client_device` | `remove-client-device` | `` | 0 | Remove a registered device |

## `navigation_views`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Missing | `GET` | `/navigation_views` | `get-navigation-views` | `` | 0 | Get all navigation views |
| Missing | `POST` | `/navigation_views` | `add-navigation-view` | `` | 0 | Add a navigation view |
| Missing | `DELETE` | `/navigation_views/{fragment}` | `remove-navigation-view` | `` | 0 | Remove a navigation view |
| Missing | `PATCH` | `/navigation_views/{fragment}` | `edit-navigation-view` | `` | 0 | Update the navigation view |

## `real_time_events`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `DELETE` | `/events` | `delete-queue` | `/api/v1/events` | 5 | Delete an event queue |
| Implemented + directly test-covered | `GET` | `/events` | `get-events` | `/api/v1/events` | 5 | Get events from an event queue |
| Missing | `POST` | `/real-time` | `` | `` | 0 |  |
| Implemented + directly test-covered | `POST` | `/register` | `register-queue` | `/api/v1/register` | 7 | Register an event queue |
| Missing | `POST` | `/rest-error-handling` | `rest-error-handling` | `` | 0 | Error handling |

## `reminders`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Missing | `GET` | `/reminders` | `get-reminders` | `` | 0 | Get reminders |
| Missing | `POST` | `/reminders` | `create-message-reminder` | `` | 0 | Create a message reminder |
| Missing | `DELETE` | `/reminders/{reminder_id}` | `delete-reminder` | `` | 0 | Delete a reminder |

## `scheduled_messages`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Missing | `GET` | `/scheduled_messages` | `get-scheduled-messages` | `` | 0 | Get scheduled messages |
| Missing | `POST` | `/scheduled_messages` | `create-scheduled-message` | `` | 0 | Create a scheduled message |
| Missing | `DELETE` | `/scheduled_messages/{scheduled_message_id}` | `delete-scheduled-message` | `` | 0 | Delete a scheduled message |
| Missing | `PATCH` | `/scheduled_messages/{scheduled_message_id}` | `update-scheduled-message` | `` | 0 | Edit a scheduled message |

## `server_and_organizations`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `GET` | `/export/realm` | `get-realm-exports` | `/api/v1/export/realm` | 4 | Get all data exports |
| Implemented + directly test-covered | `POST` | `/export/realm` | `export-realm` | `/api/v1/export/realm` | 4 | Create a data export |
| Implemented + directly test-covered | `GET` | `/export/realm/consents` | `get-realm-export-consents` | `/api/v1/export/realm/consents` | 1 | Get data export consent state |
| Implemented + directly test-covered | `GET` | `/realm/emoji` | `get-custom-emoji` | `/api/v1/realm/emoji` | 2 | Get all custom emoji |
| Implemented route only | `DELETE` | `/realm/emoji/{emoji_name}` | `deactivate-custom-emoji` | `/api/v1/realm/emoji/:emoji_name` | 0 | Deactivate custom emoji |
| Implemented route only | `POST` | `/realm/emoji/{emoji_name}` | `upload-custom-emoji` | `/api/v1/realm/emoji/:emoji_name` | 0 | Upload custom emoji |
| Missing | `POST` | `/realm/filters` | `add-linkifier` | `` | 0 | Add a linkifier |
| Missing | `DELETE` | `/realm/filters/{filter_id}` | `remove-linkifier` | `` | 0 | Remove a linkifier |
| Missing | `PATCH` | `/realm/filters/{filter_id}` | `update-linkifier` | `` | 0 | Update a linkifier |
| Missing | `GET` | `/realm/linkifiers` | `get-linkifiers` | `` | 0 | Get linkifiers |
| Missing | `PATCH` | `/realm/linkifiers` | `reorder-linkifiers` | `` | 0 | Reorder linkifiers |
| Missing | `POST` | `/realm/playgrounds` | `add-code-playground` | `` | 0 | Add a code playground |
| Missing | `DELETE` | `/realm/playgrounds/{playground_id}` | `remove-code-playground` | `` | 0 | Remove a code playground |
| Implemented + directly test-covered | `GET` | `/realm/presence` | `get-presence` | `/api/v1/realm/presence` | 1 | Get presence of all users |
| Implemented + directly test-covered | `GET` | `/realm/profile_fields` | `get-custom-profile-fields` | `/api/v1/realm/profile_fields` | 6 | Get all custom profile fields |
| Missing | `PATCH` | `/realm/profile_fields` | `reorder-custom-profile-fields` | `` | 0 | Reorder custom profile fields |
| Implemented + directly test-covered | `POST` | `/realm/profile_fields` | `create-custom-profile-field` | `/api/v1/realm/profile_fields` | 6 | Create a custom profile field |
| Missing | `POST` | `/realm/test_welcome_bot_custom_message` | `test-welcome-bot-custom-message` | `` | 0 | Test welcome bot custom message |
| Implemented + directly test-covered | `PATCH` | `/realm/user_settings_defaults` | `update-realm-user-settings-defaults` | `/api/v1/realm/user_settings_defaults` | 1 | Update realm-level defaults of user settings |
| Implemented + directly test-covered | `GET` | `/server_settings` | `get-server-settings` | `/api/v1/server_settings` | 3 | Get server settings |

## `users`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Implemented + directly test-covered | `GET` | `/attachments` | `get-attachments` | `/api/v1/attachments` | 1 | Get attachments |
| Implemented route only | `DELETE` | `/attachments/{attachment_id}` | `remove-attachment` | `/api/v1/attachments/:attachment_id` | 0 | Delete an attachment |
| Missing | `GET` | `/bots/{bot_id}/api_key` | `get-bot-api-key` | `` | 0 | Get a bot's API key |
| Missing | `POST` | `/bots/{bot_id}/api_key/regenerate` | `regenerate-bot-api-key` | `` | 0 | Regenerate a bot's API key |
| Missing | `POST` | `/messages/{message_id}/typing` | `set-typing-status-for-message-edit` | `` | 0 | Set "typing" status for message editing |
| Implemented + directly test-covered | `PATCH` | `/settings` | `update-settings` | `/api/v1/settings` | 3 | Update settings |
| Implemented + directly test-covered | `POST` | `/typing` | `set-typing-status` | `/api/v1/typing` | 4 | Set "typing" status |
| Implemented + directly test-covered | `GET` | `/user_groups` | `get-user-groups` | `/api/v1/user_groups` | 3 | Get user groups |
| Implemented + directly test-covered | `POST` | `/user_groups/create` | `create-user-group` | `/api/v1/user_groups/create` | 5 | Create a user group |
| Implemented with parameter-name/path-template differences | `PATCH` | `/user_groups/{user_group_id}` | `update-user-group` | `/api/v1/user_groups/:group_id` | 0 | Update a user group |
| Implemented with parameter-name/path-template differences | `POST` | `/user_groups/{user_group_id}/deactivate` | `deactivate-user-group` | `/api/v1/user_groups/:group_id/deactivate` | 0 | Deactivate a user group |
| Implemented with parameter-name/path-template differences | `GET` | `/user_groups/{user_group_id}/members` | `get-user-group-members` | `/api/v1/user_groups/:group_id/members` | 0 | Get user group members |
| Implemented with parameter-name/path-template differences | `POST` | `/user_groups/{user_group_id}/members` | `update-user-group-members` | `/api/v1/user_groups/:group_id/members` | 0 | Update user group members |
| Missing | `GET` | `/user_groups/{user_group_id}/members/{user_id}` | `get-is-user-group-member` | `` | 0 | Get user group membership status |
| Implemented with parameter-name/path-template differences | `GET` | `/user_groups/{user_group_id}/subgroups` | `get-user-group-subgroups` | `/api/v1/user_groups/:group_id/subgroups` | 0 | Get subgroups of a user group |
| Implemented with parameter-name/path-template differences | `POST` | `/user_groups/{user_group_id}/subgroups` | `update-user-group-subgroups` | `/api/v1/user_groups/:group_id/subgroups` | 0 | Update subgroups of a user group |
| Implemented + directly test-covered | `GET` | `/users` | `get-users` | `/api/v1/users` | 6 | Get users |
| Implemented + directly test-covered | `POST` | `/users` | `create-user` | `/api/v1/users` | 6 | Create a user |
| Implemented + directly test-covered | `DELETE` | `/users/me` | `deactivate-own-user` | `/api/v1/users/me` | 2 | Deactivate own user |
| Implemented + directly test-covered | `GET` | `/users/me` | `get-own-user` | `/api/v1/users/me` | 2 | Get own user |
| Implemented + directly test-covered | `DELETE` | `/users/me/alert_words` | `remove-alert-words` | `/api/v1/users/me/alert_words` | 8 | Remove alert words |
| Implemented + directly test-covered | `GET` | `/users/me/alert_words` | `get-alert-words` | `/api/v1/users/me/alert_words` | 8 | Get all alert words |
| Implemented + directly test-covered | `POST` | `/users/me/alert_words` | `add-alert-words` | `/api/v1/users/me/alert_words` | 8 | Add alert words |
| Implemented + directly test-covered | `DELETE` | `/users/me/android_gcm_reg_id` | `remove-fcm-token` | `/api/v1/users/me/android_gcm_reg_id` | 3 | Remove an FCM registration token |
| Implemented + directly test-covered | `POST` | `/users/me/android_gcm_reg_id` | `add-fcm-token` | `/api/v1/users/me/android_gcm_reg_id` | 3 | Add an FCM registration token |
| Implemented route only | `POST` | `/users/me/api_key/regenerate` | `regenerate-api-key` | `/api/v1/users/me/api_key/regenerate` | 0 | Regenerate your API key |
| Implemented + directly test-covered | `DELETE` | `/users/me/apns_device_token` | `remove-apns-token` | `/api/v1/users/me/apns_device_token` | 3 | Remove an APNs device token |
| Implemented + directly test-covered | `POST` | `/users/me/apns_device_token` | `add-apns-token` | `/api/v1/users/me/apns_device_token` | 3 | Add an APNs device token |
| Implemented route only | `DELETE` | `/users/me/muted_users/{muted_user_id}` | `unmute-user` | `/api/v1/users/me/muted_users/:muted_user_id` | 0 | Unmute a user |
| Implemented route only | `POST` | `/users/me/muted_users/{muted_user_id}` | `mute-user` | `/api/v1/users/me/muted_users/:muted_user_id` | 0 | Mute a user |
| Implemented + directly test-covered | `POST` | `/users/me/presence` | `update-presence` | `/api/v1/users/me/presence` | 6 | Update your presence |
| Implemented + directly test-covered | `POST` | `/users/me/status` | `update-status` | `/api/v1/users/me/status` | 5 | Update your status |
| Missing | `GET` | `/users/{email}` | `get-user-by-email` | `` | 0 | Get a user by email |
| Missing | `PATCH` | `/users/{email}` | `update-user-by-email` | `` | 0 | Update a user by email |
| Implemented route only | `GET` | `/users/{user_id_or_email}/presence` | `get-user-presence` | `/api/v1/users/:user_id_or_email/presence` | 0 | Get a user's presence |
| Implemented route only | `DELETE` | `/users/{user_id}` | `deactivate-user` | `/api/v1/users/:user_id` | 0 | Deactivate a user |
| Implemented route only | `GET` | `/users/{user_id}` | `get-user` | `/api/v1/users/:user_id` | 0 | Get a user |
| Implemented route only | `PATCH` | `/users/{user_id}` | `update-user` | `/api/v1/users/:user_id` | 0 | Update a user |
| Implemented route only | `POST` | `/users/{user_id}/reactivate` | `reactivate-user` | `/api/v1/users/:user_id/reactivate` | 0 | Reactivate a user |
| Implemented route only | `GET` | `/users/{user_id}/status` | `get-user-status` | `/api/v1/users/:user_id/status` | 0 | Get a user's status |
| Missing | `POST` | `/users/{user_id}/status` | `update-status-for-user` | `` | 0 | Update user status |

## `webhooks`

| Status | Method | Zulip path | Operation ID | Jotster route | Test refs | Summary |
|---|---|---|---|---|---:|---|
| Missing | `POST` | `/zulip-outgoing-webhook` | `zulip-outgoing-webhooks` | `` | 0 | Outgoing webhooks |

