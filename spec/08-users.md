# Users Module

## Overview

This module manages user accounts within a tenant (realm). Every person interacting with Jotster is a user record scoped to a tenant. Users have profiles (name, email, avatar, timezone), roles that determine permissions, and a large set of personal settings that control UI behavior, notification preferences, and privacy options.

Jotster supports both human users and bots. Bots are user records with `is_bot=1` and a `bot_type` indicating their purpose (generic, incoming webhook, outgoing webhook, or embedded). Bots have an owner (`bot_owner_id`) who is a human user in the same tenant.

User creation is admin-only via the API. Self-registration is handled through the invitations module (see `20-invitations.md`). Users can be deactivated (soft-disabled) and later reactivated by an admin. Deactivation revokes all API keys and marks the user as inactive, but preserves their data and message history.

Personal settings are stored in a separate `user_setting` table with a one-to-one relationship to the user. The settings model mirrors Zulip's extensive settings surface exactly, covering display preferences, notification configuration, privacy controls, and UI customization.

## API Endpoints

### Zulip-Compatible Endpoints

| Method  | Path                                  | Auth Required | Description                              |
| ------- | ------------------------------------- | ------------- | ---------------------------------------- |
| `GET`   | `/api/v1/users/me`                    | Yes           | Get own user profile                     |
| `GET`   | `/api/v1/users`                       | Yes           | List all users in organization           |
| `GET`   | `/api/v1/users/{user_id}`             | Yes           | Get user by ID                           |
| `GET`   | `/api/v1/users/{email}`               | Yes           | Get user by email                        |
| `POST`  | `/api/v1/users`                       | Yes (admin)   | Create a new user                        |
| `PATCH` | `/api/v1/users/{user_id}`             | Yes           | Update user (name, role, etc.)           |
| `DELETE`| `/api/v1/users/{user_id}`             | Yes (admin)   | Deactivate user                          |
| `DELETE`| `/api/v1/users/me`                    | Yes           | Deactivate own account                   |
| `POST`  | `/api/v1/users/{user_id}/reactivate`  | Yes (admin)   | Reactivate a deactivated user            |
| `PATCH` | `/api/v1/users/{email}`               | Yes           | Update user by email (alternative to by ID) |
| `POST`  | `/api/v1/users/me/avatar`             | Yes           | Upload user avatar                       |
| `DELETE`| `/api/v1/users/me/avatar`             | Yes           | Delete user avatar (revert to gravatar)  |
| `PATCH` | `/api/v1/users/me/profile_data`       | Yes           | Update custom profile field values for own user |
| `DELETE`| `/api/v1/users/me/profile_data`       | Yes           | Remove custom profile field values       |
| `POST`  | `/api/v1/users/me/onboarding_steps`   | Yes           | Mark an onboarding step as read          |
| `PATCH` | `/api/v1/settings`                    | Yes           | Update own personal settings             |
| `PATCH` | `/api/v1/settings/display`            | Yes           | Legacy display settings endpoint (maps to PATCH /settings) |
| `PATCH` | `/api/v1/settings/notifications`      | Yes           | Legacy notification settings endpoint (maps to PATCH /settings) |

### Bot Management Endpoints

| Method  | Path                                          | Auth Required | Description                              |
| ------- | --------------------------------------------- | ------------- | ---------------------------------------- |
| `GET`   | `/api/v1/bots`                                | Yes           | List owned bots                          |
| `POST`  | `/api/v1/bots`                                | Yes           | Create a bot                             |
| `PATCH` | `/api/v1/bots/{bot_id}`                       | Yes           | Update a bot                             |
| `DELETE`| `/api/v1/bots/{bot_id}`                       | Yes           | Deactivate a bot                         |
| `GET`   | `/api/v1/bots/{bot_id}/api_key`               | Yes           | Get a bot's API key                      |
| `POST`  | `/api/v1/bots/{bot_id}/api_key/regenerate`    | Yes           | Regenerate a bot's API key               |

### Endpoint Details

#### GET /api/v1/users/me

Returns the authenticated user's own profile, including all profile fields and settings.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "user_id": "u_abc123",
  "email": "user@example.com",
  "full_name": "Alice Smith",
  "role": 400,
  "avatar_url": "https://...",
  "avatar_source": "gravatar",
  "is_bot": false,
  "is_active": true,
  "timezone": "America/New_York",
  "date_joined": "2025-01-15T00:00:00Z",
  "is_billing_admin": false,
  "delivery_email": "user@example.com"
}
```

#### GET /api/v1/users

**Query Parameters:**

| Parameter              | Type    | Required | Description                                      |
| ---------------------- | ------- | -------- | ------------------------------------------------ |
| `client_gravatar`      | boolean | No       | Whether to include gravatar URLs (default false)  |
| `include_custom_profile_fields` | boolean | No | Include custom profile field values (default false) |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "members": [
    {
      "user_id": "u_abc123",
      "email": "user@example.com",
      "full_name": "Alice Smith",
      "role": 400,
      "avatar_url": "https://...",
      "is_bot": false,
      "is_active": true,
      "timezone": "America/New_York",
      "date_joined": "2025-01-15T00:00:00Z"
    }
  ]
}
```

#### GET /api/v1/users/{user_id}

Returns a single user's profile by their user ID.

**Response (200):** Same shape as a single member object from the list endpoint, wrapped in `{ "result": "success", "msg": "", "user": { ... } }`.

**Error (404):** User not found.

#### GET /api/v1/users/{email}

Returns a single user's profile by their email address.

**Response (200):** Same shape as the user ID lookup endpoint.

**Error (404):** User not found.

#### POST /api/v1/users

Admin-only. Creates a new user account in the tenant.

**Request (form-encoded):**

| Parameter    | Type   | Required | Description                |
| ------------ | ------ | -------- | -------------------------- |
| `email`      | string | Yes      | User's email address       |
| `password`   | string | Yes      | Initial password           |
| `full_name`  | string | Yes      | User's display name        |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "user_id": "u_xyz789"
}
```

**Error (400):** Email already in use within the tenant.

#### PATCH /api/v1/users/{user_id}

Update a user's profile fields. Admins can update any user. Non-admins can only update their own limited fields (full_name).

**Request (form-encoded):**

| Parameter    | Type   | Required | Description                                      |
| ------------ | ------ | -------- | ------------------------------------------------ |
| `full_name`  | string | No       | New display name                                 |
| `role`       | int    | No       | New role (admin-only)                            |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### DELETE /api/v1/users/{user_id}

Admin-only. Deactivates a user, revoking all their API keys and marking them inactive.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### DELETE /api/v1/users/me

Deactivates the authenticated user's own account. See also `01-server-and-auth.md` which references this endpoint.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### POST /api/v1/users/{user_id}/reactivate

Admin-only. Reactivates a previously deactivated user.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** User is already active.

#### PATCH /api/v1/settings

Updates the authenticated user's personal settings. Accepts any subset of the settings fields defined in the `user_setting` table. Only the provided fields are updated; omitted fields remain unchanged.

**Request (form-encoded):** Any combination of `user_setting` column names as keys with their new values.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "ignored_parameters_unsupported": []
}
```

#### PATCH /api/v1/users/{email}

Update a user's profile fields by email address. Behaves identically to `PATCH /api/v1/users/{user_id}` but resolves the user by email instead of by ID. Admins can update any user. Non-admins can only update their own limited fields (`full_name`).

**Request (form-encoded):** Same parameters as `PATCH /api/v1/users/{user_id}`.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (404):** User not found.

#### POST /api/v1/users/me/avatar

Upload a new avatar image for the authenticated user. The image is stored and the user's `avatar_source` is set to `"uploaded"`.

**Request:** Multipart form data with an `file` field containing the image (PNG, JPEG, or GIF, max 5 MB).

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "avatar_url": "https://..."
}
```

**Error (400):** Invalid image format or file too large.

#### DELETE /api/v1/users/me/avatar

Deletes the authenticated user's uploaded avatar and reverts to using their gravatar. Sets `avatar_source` back to `"gravatar"` and clears the stored avatar.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "avatar_url": "https://..."
}
```

#### PATCH /api/v1/users/me/profile_data

Update custom profile field values for the authenticated user.

**Request (JSON):**

| Parameter      | Type  | Required | Description                                                    |
| -------------- | ----- | -------- | -------------------------------------------------------------- |
| `profile_data` | array | Yes      | Array of `{ id, value }` objects specifying field ID and value |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Invalid profile field ID or value does not match field type.

#### DELETE /api/v1/users/me/profile_data

Remove custom profile field values for the authenticated user. Clears all custom profile field values, or specific ones if IDs are provided.

**Request (JSON):**

| Parameter | Type  | Required | Description                                             |
| --------- | ----- | -------- | ------------------------------------------------------- |
| `id`      | array | No       | Array of profile field IDs to remove. If omitted, all custom profile field values are cleared. |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### POST /api/v1/users/me/onboarding_steps

Mark an onboarding step (also known as a hotspot) as read for the authenticated user.

**Request (form-encoded):**

| Parameter        | Type   | Required | Description                      |
| ---------------- | ------ | -------- | -------------------------------- |
| `onboarding_step`| string | Yes      | Name of the onboarding step      |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### PATCH /api/v1/settings/display

Legacy endpoint for updating display-related settings. Maps directly to `PATCH /api/v1/settings` but only accepts display-related setting keys (e.g. `twenty_four_hour_time`, `dense_mode`, `color_scheme`, `emojiset`, `default_language`, `default_view`, `left_side_userlist`, `high_contrast_mode`, `web_font_size_px`, `web_line_height_percent`, `fluid_layout_width`, `starred_message_counts`, `translate_emoticons`, `display_emoji_reaction_users`, `escape_navigates_to_default_view`).

**Request (form-encoded):** Any combination of display setting keys.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "ignored_parameters_unsupported": []
}
```

#### PATCH /api/v1/settings/notifications

Legacy endpoint for updating notification-related settings. Maps directly to `PATCH /api/v1/settings` but only accepts notification-related setting keys (e.g. `enable_stream_desktop_notifications`, `enable_stream_email_notifications`, `enable_stream_push_notifications`, `enable_stream_audible_notifications`, `notification_sound`, `enable_desktop_notifications`, `enable_sounds`, `enable_offline_email_notifications`, `enable_offline_push_notifications`, `enable_online_push_notifications`, `enable_followed_topic_desktop_notifications`, `enable_followed_topic_email_notifications`, `enable_followed_topic_push_notifications`, `enable_followed_topic_audible_notifications`, `email_notifications_batching_period_seconds`, `message_content_in_email_notifications`, `pm_content_in_desktop_notifications`, `wildcard_mentions_notify`).

**Request (form-encoded):** Any combination of notification setting keys.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "ignored_parameters_unsupported": []
}
```

#### GET /api/v1/bots

Returns a list of all bots owned by the authenticated user.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "bots": [
    {
      "user_id": "u_bot001",
      "email": "my-bot@example.com",
      "full_name": "My Bot",
      "bot_type": 1,
      "bot_owner_id": "u_abc123",
      "is_active": true,
      "avatar_url": "https://..."
    }
  ]
}
```

#### POST /api/v1/bots

Create a new bot. Bots are stored in the `user` table with `is_bot=1` and bot-specific fields. The authenticated user becomes the bot's owner.

**Request (form-encoded):**

| Parameter    | Type   | Required | Description                                              |
| ------------ | ------ | -------- | -------------------------------------------------------- |
| `full_name`  | string | Yes      | Bot's display name                                       |
| `short_name` | string | Yes      | Bot's short name (used to generate bot email)            |
| `bot_type`   | int    | No       | Bot type: 1=generic (default), 2=incoming_webhook, 3=outgoing_webhook, 4=embedded |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "user_id": "u_bot002",
  "api_key": "generated_api_key_here"
}
```

**Error (400):** Bot name already in use or invalid bot type.

#### PATCH /api/v1/bots/{bot_id}

Update a bot's profile fields. Only the bot's owner or an admin can update a bot.

**Request (form-encoded):**

| Parameter      | Type   | Required | Description                                      |
| -------------- | ------ | -------- | ------------------------------------------------ |
| `full_name`    | string | No       | New display name for the bot                     |
| `bot_owner_id` | string | No       | Transfer ownership to another user (admin-only)  |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "user_id": "u_bot002",
  "full_name": "Updated Bot Name"
}
```

**Error (404):** Bot not found or not owned by the authenticated user.

#### DELETE /api/v1/bots/{bot_id}

Deactivate a bot. Only the bot's owner or an admin can deactivate a bot. Sets `is_active=0` on the bot's user record and revokes all its API keys.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (404):** Bot not found or not owned by the authenticated user.

#### GET /api/v1/bots/{bot_id}/api_key

Retrieve the API key for a bot. Only the bot's owner or an admin can access a bot's API key.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "api_key": "current_api_key_here"
}
```

**Error (404):** Bot not found or not owned by the authenticated user.

#### POST /api/v1/bots/{bot_id}/api_key/regenerate

Regenerate the API key for a bot. Revokes the existing key and generates a new one. Only the bot's owner or an admin can regenerate a bot's API key.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "api_key": "new_api_key_here"
}
```

**Error (404):** Bot not found or not owned by the authenticated user.

## Data Model

### user

Stores user accounts within a tenant. Each user belongs to exactly one tenant and has a unique email within that tenant.

| Column           | Type    | Constraints                    | Description                                                              |
| ---------------- | ------- | ------------------------------ | ------------------------------------------------------------------------ |
| `id`             | TEXT    | PK                             | System-generated nanoid                                                  |
| `tenant_id`      | TEXT    | NOT NULL, FK -> tenant         | Owning tenant                                                            |
| `email`          | TEXT    | NOT NULL                       | Display email address                                                    |
| `full_name`      | TEXT    | NOT NULL                       | User's display name                                                      |
| `password_hash`  | TEXT    | NULL                           | Bcrypt hash of password; NULL for non-email auth                         |
| `role`           | INTEGER | NOT NULL DEFAULT 400           | Permission role: 100=owner, 200=admin, 300=moderator, 400=member, 600=guest |
| `avatar_url`     | TEXT    | NULL                           | URL to user's avatar image                                               |
| `avatar_source`  | TEXT    | NOT NULL DEFAULT 'gravatar'    | Avatar source: "gravatar" or "uploaded"                                  |
| `is_bot`         | INTEGER | NOT NULL DEFAULT 0             | Boolean 0/1, whether this is a bot account                               |
| `bot_type`       | INTEGER | NULL                           | Bot type: 1=generic, 2=incoming_webhook, 3=outgoing_webhook, 4=embedded  |
| `bot_owner_id`   | TEXT    | NULL, FK -> user               | Owner of the bot (human user); NULL for non-bots                         |
| `is_active`      | INTEGER | NOT NULL DEFAULT 1             | Boolean 0/1, whether user is active                                      |
| `timezone`       | TEXT    | NOT NULL DEFAULT ''            | IANA timezone string                                                     |
| `date_joined`    | INTEGER | NOT NULL                       | Unix milliseconds when user joined                                       |
| `is_billing_admin` | INTEGER | NOT NULL DEFAULT 0           | Boolean 0/1, whether user is a billing admin                             |
| `delivery_email` | TEXT    | NOT NULL                       | Real email address (may differ from display email)                       |
| `created_at`     | INTEGER | NOT NULL                       | Unix milliseconds                                                        |
| `updated_at`     | INTEGER | NOT NULL                       | Unix milliseconds                                                        |

**Constraints:**

- UNIQUE (`tenant_id`, `email`) -- no duplicate emails within a tenant.

**Indexes:**

- `ix_user_tenant_email` on `(tenant_id, email)` -- fast lookup by email within tenant.
- `ix_user_tenant_active` on `(tenant_id, is_active)` -- efficient listing of active users.

### user_setting

Stores personal settings for each user. One-to-one relationship with the `user` table. All settings have sensible defaults and are created when a user is created.

| Column                                                  | Type    | Constraints              | Description                                                            |
| ------------------------------------------------------- | ------- | ------------------------ | ---------------------------------------------------------------------- |
| `user_id`                                               | TEXT    | PK, FK -> user           | Owning user                                                            |
| `tenant_id`                                             | TEXT    | NOT NULL, FK -> tenant   | Owning tenant (denormalized for query efficiency)                      |
| `twenty_four_hour_time`                                 | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, use 24-hour time format                                   |
| `dense_mode`                                            | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, enable dense/compact UI mode                              |
| `web_font_size_px`                                      | INTEGER | NOT NULL DEFAULT 14      | Font size in pixels for the web UI                                     |
| `web_line_height_percent`                               | INTEGER | NOT NULL DEFAULT 122     | Line height as percentage for the web UI                               |
| `starred_message_counts`                                | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, show count of starred messages                            |
| `fluid_layout_width`                                    | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, use fluid (full-width) layout                             |
| `high_contrast_mode`                                    | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, enable high contrast mode                                 |
| `color_scheme`                                          | INTEGER | NOT NULL DEFAULT 3       | Color scheme: 1=dark, 2=light, 3=automatic                            |
| `translate_emoticons`                                   | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, convert text emoticons to emoji                           |
| `display_emoji_reaction_users`                          | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, show who reacted with each emoji                          |
| `default_language`                                      | TEXT    | NOT NULL DEFAULT 'en'    | Default UI language code                                               |
| `default_view`                                          | TEXT    | NOT NULL DEFAULT 'recent_topics' | Default home view                                               |
| `escape_navigates_to_default_view`                      | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, pressing Escape navigates to default view                 |
| `left_side_userlist`                                    | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, show user list on the left side                           |
| `emojiset`                                              | TEXT    | NOT NULL DEFAULT 'google' | Emoji set: "google", "twitter", "text", "google-blob"                 |
| `demote_inactive_streams`                               | INTEGER | NOT NULL DEFAULT 1       | Inactive stream demotion: 1=automatic, 2=always, 3=never              |
| `enable_stream_desktop_notifications`                   | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, desktop notifications for stream messages                 |
| `enable_stream_email_notifications`                     | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, email notifications for stream messages                   |
| `enable_stream_push_notifications`                      | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, push notifications for stream messages                    |
| `enable_stream_audible_notifications`                   | INTEGER | NOT NULL DEFAULT 0       | Boolean 0/1, audible notifications for stream messages                 |
| `notification_sound`                                    | TEXT    | NOT NULL DEFAULT 'zulip' | Notification sound name                                                |
| `enable_desktop_notifications`                          | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, enable desktop notifications for DMs                      |
| `enable_sounds`                                         | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, enable notification sounds                                |
| `enable_offline_email_notifications`                    | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, email notifications when offline                          |
| `enable_offline_push_notifications`                     | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, push notifications when offline                           |
| `enable_online_push_notifications`                      | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, push notifications when online                            |
| `enable_followed_topic_desktop_notifications`           | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, desktop notifications for followed topics                 |
| `enable_followed_topic_email_notifications`             | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, email notifications for followed topics                   |
| `enable_followed_topic_push_notifications`              | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, push notifications for followed topics                    |
| `enable_followed_topic_audible_notifications`           | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, audible notifications for followed topics                 |
| `email_notifications_batching_period_seconds`           | INTEGER | NOT NULL DEFAULT 120     | Batching period for email notifications in seconds                     |
| `enable_drafts_synchronization`                         | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, sync drafts across devices                                |
| `message_content_in_email_notifications`                | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, include message content in email notifications            |
| `pm_content_in_desktop_notifications`                   | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, show DM content in desktop notifications                  |
| `wildcard_mentions_notify`                              | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, notify on @-all and @-everyone mentions                   |
| `presence_enabled`                                      | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, share presence/online status                              |
| `send_private_typing_notifications`                     | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, send typing indicators in DMs                             |
| `send_stream_typing_notifications`                      | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, send typing indicators in streams                         |
| `send_read_receipts`                                    | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, send read receipts to other users                         |
| `email_address_visibility`                              | INTEGER | NOT NULL DEFAULT 1       | Email visibility policy (1=everyone, 2=members, 3=admins, 4=nobody, 5=moderators) |
| `realm_name_in_email_notifications_policy`              | INTEGER | NOT NULL DEFAULT 1       | When to include realm name in email notifications (1=automatic, 2=always, 3=never) |
| `automatically_follow_topics_policy`                    | INTEGER | NOT NULL DEFAULT 0       | Auto-follow topics policy (0=never, 1=participating, 2=always)         |
| `automatically_unmute_topics_in_muted_streams_policy`   | INTEGER | NOT NULL DEFAULT 0       | Auto-unmute topics in muted streams policy (0=never, 1=participating, 2=always) |
| `automatically_follow_topics_where_mentioned`           | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, auto-follow topics where user is mentioned                |
| `user_list_style`                                       | INTEGER | NOT NULL DEFAULT 1       | User list display style (1=with_status, 2=compact)                     |
| `web_stream_unreads_count_display_policy`               | INTEGER | NOT NULL DEFAULT 1       | Unread count display policy (1=all, 2=unmuted, 3=none)                 |
| `web_navigate_to_sent_message`                          | INTEGER | NOT NULL DEFAULT 1       | Boolean 0/1, navigate to message after sending                         |
| `web_channel_default_view`                              | INTEGER | NOT NULL DEFAULT 1       | Default channel view (1=top, 2=first_unread)                           |

## Repository Interface

### IUserRepository

```
getUser(tenantId: string, userId: string) -> Result<User | null>
getUserByEmail(tenantId: string, email: string) -> Result<User | null>
getAllUsers(tenantId: string, includeDeactivated: boolean) -> Result<User[]>
createUser(tenantId: string, email: string, fullName: string, passwordHash: string, role: int) -> Result<User>
updateUser(tenantId: string, userId: string, updates: UserUpdate) -> Result<User>
deactivateUser(tenantId: string, userId: string) -> Result<void>
reactivateUser(tenantId: string, userId: string) -> Result<void>
updateUserByEmail(tenantId: string, email: string, updates: UserUpdate) -> Result<User>
uploadAvatar(tenantId: string, userId: string, imageData: Buffer, contentType: string) -> Result<string>
deleteAvatar(tenantId: string, userId: string) -> Result<string>
updateProfileData(tenantId: string, userId: string, profileData: { id: string, value: string }[]) -> Result<void>
deleteProfileData(tenantId: string, userId: string, fieldIds: string[] | null) -> Result<void>
markOnboardingStepRead(tenantId: string, userId: string, onboardingStep: string) -> Result<void>
getUserSettings(tenantId: string, userId: string) -> Result<UserSettings>
updateUserSettings(tenantId: string, userId: string, updates: UserSettingsUpdate) -> Result<UserSettings>
```

### IBotRepository

Bots are stored in the `user` table with `is_bot=1` and bot-specific fields (`bot_type`, `bot_owner_id`). Bot repository methods provide a focused interface for bot-specific operations.

```
getOwnedBots(tenantId: string, ownerUserId: string) -> Result<User[]>
getBot(tenantId: string, botId: string) -> Result<User | null>
createBot(tenantId: string, ownerUserId: string, fullName: string, email: string, botType: int) -> Result<User>
updateBot(tenantId: string, botId: string, updates: BotUpdate) -> Result<User>
deactivateBot(tenantId: string, botId: string) -> Result<void>
getBotApiKey(tenantId: string, botId: string) -> Result<string>
regenerateBotApiKey(tenantId: string, botId: string) -> Result<string>
```

### Method Details

#### getUser

Retrieve a single user by tenant and user ID. Returns `null` if not found.

#### getUserByEmail

Retrieve a single user by tenant and email address. Returns `null` if not found. Uses the `ix_user_tenant_email` index.

#### getAllUsers

Retrieve all users within a tenant. When `includeDeactivated` is `false`, only returns users with `is_active=1`. When `true`, returns all users regardless of active status.

#### createUser

Insert a new user record. Generates a nanoid for the `id` field. Sets `created_at`, `updated_at`, and `date_joined` to the current Unix milliseconds. Also creates a corresponding `user_setting` record with all default values.

#### updateUser

Partial update of user fields. Only the fields present in `updates` are changed. Updates `updated_at` to current Unix milliseconds.

#### deactivateUser

Set `is_active=0` and update `updated_at`. Does not delete the user record.

#### reactivateUser

Set `is_active=1` and update `updated_at`.

#### getUserSettings

Retrieve the personal settings for a user. Returns the full `user_setting` record.

#### updateUserByEmail

Look up a user by tenant and email, then apply a partial update of user fields. Uses the `ix_user_tenant_email` index for lookup. Returns the updated user, or `null` if no user with that email exists.

#### uploadAvatar

Store the provided image data as the user's avatar. Updates the user's `avatar_url` to point to the stored image and sets `avatar_source` to `"uploaded"`. Returns the new avatar URL.

#### deleteAvatar

Remove the user's uploaded avatar and revert to gravatar. Sets `avatar_source` to `"gravatar"` and updates `avatar_url` to the gravatar URL. Returns the new gravatar-based avatar URL.

#### updateProfileData

Update custom profile field values for a user. Each entry in `profileData` specifies a profile field ID and the new value. Creates or updates entries in the user's profile data store.

#### deleteProfileData

Remove custom profile field values for a user. If `fieldIds` is provided, only those specific fields are cleared. If `fieldIds` is `null`, all custom profile field values for the user are removed.

#### markOnboardingStepRead

Record that a user has completed a specific onboarding step. The step name is stored so it will not be shown again.

#### updateUserSettings

Partial update of user settings. Only the fields present in `updates` are changed.

#### getOwnedBots

Retrieve all bot users owned by a given human user. Queries the `user` table for records where `is_bot=1` and `bot_owner_id` matches the owner user ID within the tenant.

#### getBot

Retrieve a single bot by tenant and bot ID. Returns `null` if not found or if the user is not a bot (`is_bot=0`).

#### createBot

Insert a new bot user record with `is_bot=1`. Generates a nanoid for the `id` field. Sets `bot_type` and `bot_owner_id`. The bot's email is auto-generated from the short name. Also generates an initial API key for the bot. Creates a corresponding `user_setting` record with defaults.

#### updateBot

Partial update of bot-specific fields. Supports updating `full_name` and `bot_owner_id` (ownership transfer). Updates `updated_at` to current Unix milliseconds.

#### deactivateBot

Set `is_active=0` on the bot's user record and update `updated_at`. Does not delete the record.

#### getBotApiKey

Retrieve the current API key for a bot. Returns the active API key string.

#### regenerateBotApiKey

Revoke the bot's existing API key and generate a new one. Returns the new API key string.

## Domain Functions

### createUser

```
createUser(repo: IUserRepository, apiKeyRepo: IApiKeyRepository, tenantId: string, email: string, fullName: string, password: string, role: int) -> Result<User>
```

1. Validate email format.
2. Check that no existing active user has the same email within the tenant via `getUserByEmail`.
3. Hash the password with bcrypt.
4. Assign the provided role (default 400=member if not specified).
5. Call `repo.createUser` to persist the user and default settings.
6. Emit a `realm_user` event with `op: "add"` containing the new user's profile.
7. Return the created user.

### updateUser

```
updateUser(repo: IUserRepository, tenantId: string, actingUserId: string, targetUserId: string, updates: UserUpdate) -> Result<User>
```

1. Load the acting user to check permissions.
2. If `actingUserId === targetUserId`, allow updates to limited fields only (`full_name`, `timezone`).
3. If the acting user is an admin (role <= 200), allow updates to all fields including `role`.
4. Owners (role=100) cannot be demoted except by themselves.
5. Call `repo.updateUser` to persist changes.
6. Emit a `realm_user` event with `op: "update"` containing the changed fields.
7. Return the updated user.

### deactivateUser

```
deactivateUser(repo: IUserRepository, apiKeyRepo: IApiKeyRepository, tenantId: string, actingUserId: string, targetUserId: string) -> Result<void>
```

1. Load the acting user to check permissions.
2. If deactivating another user, the acting user must be an admin (role <= 200).
3. If deactivating self, no admin check needed.
4. Cannot deactivate the last owner of a tenant.
5. Call `repo.deactivateUser` to set `is_active=0`.
6. Call `apiKeyRepo.RevokeAllApiKeysForUser` to revoke all active API keys.
7. Emit a `realm_user` event with `op: "remove"` containing the deactivated user's ID and profile.

### reactivateUser

```
reactivateUser(repo: IUserRepository, tenantId: string, actingUserId: string, targetUserId: string) -> Result<void>
```

1. Load the acting user to check permissions. Must be an admin (role <= 200).
2. Load the target user. Return error if user is already active.
3. Call `repo.reactivateUser` to set `is_active=1`.
4. Emit a `realm_user` event with `op: "add"` containing the reactivated user's profile.

### updateSettings

```
updateSettings(repo: IUserRepository, tenantId: string, userId: string, updates: UserSettingsUpdate) -> Result<UserSettings>
```

1. Validate setting values against their expected types and ranges:
   - Boolean settings must be 0 or 1.
   - `color_scheme` must be 1, 2, or 3.
   - `emojiset` must be one of "google", "twitter", "text", "google-blob".
   - `demote_inactive_streams` must be 1, 2, or 3.
   - `web_font_size_px` must be within reasonable bounds (10-30).
   - `web_line_height_percent` must be within reasonable bounds (100-200).
2. Call `repo.updateUserSettings` to persist changes.
3. Emit a `user_settings` event with `op: "update"` containing the changed setting keys and values.
4. Return the updated settings.

### updateUserByEmail

```
updateUserByEmail(repo: IUserRepository, tenantId: string, actingUserId: string, targetEmail: string, updates: UserUpdate) -> Result<User>
```

1. Look up the target user by email via `repo.getUserByEmail`.
2. Return error if user not found.
3. Delegate to the `updateUser` domain function using the resolved user's ID as `targetUserId`.

### uploadAvatar

```
uploadAvatar(repo: IUserRepository, tenantId: string, userId: string, imageData: Buffer, contentType: string) -> Result<string>
```

1. Validate that `contentType` is an allowed image type (PNG, JPEG, or GIF).
2. Validate that image data does not exceed 5 MB.
3. Call `repo.uploadAvatar` to store the image and update the user record.
4. Emit a `realm_user` event with `op: "update"` containing updated `avatar_url` and `avatar_source`.
5. Return the new avatar URL.

### deleteAvatar

```
deleteAvatar(repo: IUserRepository, tenantId: string, userId: string) -> Result<string>
```

1. Call `repo.deleteAvatar` to remove the uploaded avatar and revert to gravatar.
2. Emit a `realm_user` event with `op: "update"` containing updated `avatar_url` and `avatar_source`.
3. Return the gravatar-based avatar URL.

### updateProfileData

```
updateProfileData(repo: IUserRepository, tenantId: string, userId: string, profileData: { id: string, value: string }[]) -> Result<void>
```

1. Validate each profile field ID exists and the value matches the expected field type.
2. Call `repo.updateProfileData` to persist the custom profile field values.
3. Emit a `realm_user` event with `op: "update"` containing the updated `profile_data`.

### deleteProfileData

```
deleteProfileData(repo: IUserRepository, tenantId: string, userId: string, fieldIds: string[] | null) -> Result<void>
```

1. If `fieldIds` is provided, validate each field ID exists.
2. Call `repo.deleteProfileData` to remove the specified (or all) custom profile field values.
3. Emit a `realm_user` event with `op: "update"` containing the updated `profile_data`.

### markOnboardingStepRead

```
markOnboardingStepRead(repo: IUserRepository, tenantId: string, userId: string, onboardingStep: string) -> Result<void>
```

1. Validate that `onboardingStep` is a recognized step name.
2. Call `repo.markOnboardingStepRead` to record the step as completed.
3. Emit an `onboarding_steps` event with `op: "update"` containing the step name.

### updateDisplaySettings (Legacy)

```
updateDisplaySettings(repo: IUserRepository, tenantId: string, userId: string, updates: UserSettingsUpdate) -> Result<UserSettings>
```

1. Filter `updates` to only include recognized display-related setting keys.
2. Delegate to the `updateSettings` domain function with the filtered updates.

### updateNotificationSettings (Legacy)

```
updateNotificationSettings(repo: IUserRepository, tenantId: string, userId: string, updates: UserSettingsUpdate) -> Result<UserSettings>
```

1. Filter `updates` to only include recognized notification-related setting keys.
2. Delegate to the `updateSettings` domain function with the filtered updates.

### createBot

```
createBot(repo: IBotRepository, apiKeyRepo: IApiKeyRepository, tenantId: string, ownerUserId: string, fullName: string, shortName: string, botType: int) -> Result<{ user: User, apiKey: string }>
```

1. Validate that `botType` is a valid bot type (1, 2, 3, or 4). Default to 1 (generic) if not specified.
2. Generate the bot's email address from `shortName` (e.g., `{shortName}-bot@{tenant_domain}`).
3. Check that no existing user has the same email within the tenant.
4. Call `repo.createBot` to create the bot user record with `is_bot=1`, `bot_type`, and `bot_owner_id` set to `ownerUserId`.
5. Generate an API key for the bot via `apiKeyRepo`.
6. Emit a `realm_bot` event with `op: "add"` containing the new bot's profile.
7. Return the created bot user and its API key.

### updateBot

```
updateBot(repo: IBotRepository, tenantId: string, actingUserId: string, botId: string, updates: BotUpdate) -> Result<User>
```

1. Load the bot via `repo.getBot`. Return error if not found.
2. Verify the acting user is the bot's owner (`bot_owner_id`) or an admin (role <= 200).
3. If `bot_owner_id` is being changed (ownership transfer), verify the acting user is an admin.
4. Call `repo.updateBot` to persist the changes.
5. Emit a `realm_bot` event with `op: "update"` containing the changed fields.
6. Return the updated bot.

### deactivateBot

```
deactivateBot(repo: IBotRepository, apiKeyRepo: IApiKeyRepository, tenantId: string, actingUserId: string, botId: string) -> Result<void>
```

1. Load the bot via `repo.getBot`. Return error if not found.
2. Verify the acting user is the bot's owner (`bot_owner_id`) or an admin (role <= 200).
3. Call `repo.deactivateBot` to set `is_active=0`.
4. Call `apiKeyRepo.RevokeAllApiKeysForUser` to revoke the bot's API keys.
5. Emit a `realm_bot` event with `op: "remove"` containing the bot's ID.

### getBotApiKey

```
getBotApiKey(repo: IBotRepository, tenantId: string, actingUserId: string, botId: string) -> Result<string>
```

1. Load the bot via `repo.getBot`. Return error if not found.
2. Verify the acting user is the bot's owner (`bot_owner_id`) or an admin (role <= 200).
3. Return the bot's API key via `repo.getBotApiKey`.

### regenerateBotApiKey

```
regenerateBotApiKey(repo: IBotRepository, apiKeyRepo: IApiKeyRepository, tenantId: string, actingUserId: string, botId: string) -> Result<string>
```

1. Load the bot via `repo.getBot`. Return error if not found.
2. Verify the acting user is the bot's owner (`bot_owner_id`) or an admin (role <= 200).
3. Call `repo.regenerateBotApiKey` to revoke the old key and generate a new one.
4. Emit a `realm_bot` event with `op: "update"` containing `{ bot_id, api_key_regenerated: true }`.
5. Return the new API key.

## Events

| Event Type       | Op       | Trigger                          | Payload                                                                                   |
| ---------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `realm_user`     | `add`    | User created or reactivated      | `{ type: "realm_user", op: "add", person: { user_id, email, full_name, role, ... } }`     |
| `realm_user`     | `update` | User profile changed             | `{ type: "realm_user", op: "update", person: { user_id, ...changed_fields } }`            |
| `realm_user`     | `remove` | User deactivated                 | `{ type: "realm_user", op: "remove", person: { user_id, full_name, email } }`             |
| `user_settings`  | `update` | Personal settings changed        | `{ type: "user_settings", op: "update", property: "setting_name", value: new_value }`     |
| `onboarding_steps` | `update` | Onboarding step marked as read | `{ type: "onboarding_steps", op: "update", onboarding_step: "step_name" }`                |
| `realm_bot`      | `add`    | Bot created                      | `{ type: "realm_bot", op: "add", bot: { user_id, email, full_name, bot_type, ... } }`     |
| `realm_bot`      | `update` | Bot profile changed              | `{ type: "realm_bot", op: "update", bot: { user_id, ...changed_fields } }`                |
| `realm_bot`      | `remove` | Bot deactivated                  | `{ type: "realm_bot", op: "remove", bot: { user_id } }`                                   |

All events are dispatched to the event queue module (see `02-event-queue.md`) for delivery to connected clients. The `realm_user` and `realm_bot` events are broadcast to all active users in the tenant. The `user_settings` and `onboarding_steps` events are delivered only to the user whose settings changed (since settings are personal).
