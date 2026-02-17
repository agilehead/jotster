# 21 - Push Notifications

## Overview

The push notifications module manages mobile push notification delivery via APNs (Apple Push Notification service) and FCM (Firebase Cloud Messaging). Users register their device tokens with the server, and the server sends push notifications when relevant events occur (new messages, mentions, DMs) and the user is not actively present.

Zulip uses a "bouncer" architecture where self-hosted servers relay push notifications through a central push notification service. Jotster supports three modes: disabled (no push), direct (connect to APNs/FCM directly), and bouncer (relay through an external push notification service).

Push notifications are outbound-only -- the module does not emit real-time events to clients. Instead, it listens for message events and user presence state to decide when to dispatch push notifications.

Package: `notifications`

## API Endpoints

| Method | Path                                        | Description                                           |
| ------ | ------------------------------------------- | ----------------------------------------------------- |
| POST   | /api/v1/users/me/android_gcm_reg_id        | Register an Android FCM/GCM push token                |
| DELETE | /api/v1/users/me/android_gcm_reg_id        | Unregister an Android push token                      |
| POST   | /api/v1/users/me/apns_device_token         | Register an iOS APNs device token                     |
| DELETE | /api/v1/users/me/apns_device_token         | Unregister an iOS push token                          |
| POST   | /api/v1/mobile_push/test_notification      | Send a test push notification to the user's devices   |
| POST   | /api/v1/mobile_push/register               | Register E2EE push device                             |
| POST   | /api/v1/mobile_push/e2ee/test_notification | Send E2EE test push notification                      |

### POST /api/v1/users/me/android_gcm_reg_id

Register an Android device token for push notifications.

**Request parameters:**
- `token` (string) -- the FCM/GCM registration token

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### DELETE /api/v1/users/me/android_gcm_reg_id

Unregister an Android device token.

**Request parameters:**
- `token` (string) -- the token to unregister

### POST /api/v1/users/me/apns_device_token

Register an iOS device token for push notifications.

**Request parameters:**
- `token` (string) -- the APNs device token (hex-encoded)
- `appid` (string) -- the iOS app bundle identifier

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### DELETE /api/v1/users/me/apns_device_token

Unregister an iOS device token.

**Request parameters:**
- `token` (string) -- the token to unregister

### POST /api/v1/mobile_push/test_notification

Send a test push notification to all of the requesting user's registered devices.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### POST /api/v1/mobile_push/register

Register an end-to-end encrypted (E2EE) push device. This endpoint registers a device for E2EE push notifications, where the notification payload is encrypted client-side and can only be decrypted by the receiving device.

**Request parameters:**
- `token` (string) -- the device push token
- `kind` (string) -- `"android_gcm"` or `"apns"`
- `ios_app_id` (string, optional) -- iOS app bundle identifier (for APNs only)

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### POST /api/v1/mobile_push/e2ee/test_notification

Send an E2EE test push notification to verify that encrypted push delivery is working correctly for the requesting user's devices.

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

## Data Model

### `push_device_token`

| Column      | Type   | Constraints                              | Description                              |
| ----------- | ------ | ---------------------------------------- | ---------------------------------------- |
| id          | string | PK                                       | Nanoid                                   |
| tenant_id   | string | FK -> tenant, NOT NULL                   | Tenant scope                             |
| user_id     | string | FK -> user, NOT NULL                     | The user who registered the token        |
| kind        | string | NOT NULL                                 | `"android_gcm"` or `"apns"`             |
| token       | string | NOT NULL                                 | The device push token                    |
| ios_app_id  | string | nullable                                 | iOS app bundle identifier (for APNs only) |
| created_at  | int    | NOT NULL                                 | Unix milliseconds                        |

**Indexes:**

| Name                              | Columns                              | Purpose                                 |
| --------------------------------- | ------------------------------------ | --------------------------------------- |
| uq_push_device_token              | (tenant_id, user_id, token)          | UNIQUE -- one registration per token per user |
| ix_push_device_token_user         | (tenant_id, user_id)                 | Fetch all tokens for a user             |

## Configuration

Push notification mode is configured in `jotster.config.json`:

```json
{
  "push": {
    "mode": "disabled",
    "bouncerUrl": null,
    "gcmApiKey": null,
    "apnsCertPath": null,
    "apnsKeyId": null,
    "apnsTeamId": null,
    "apnsBundleId": null
  }
}
```

| Field          | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `mode`         | `"disabled"` -- no push notifications; `"direct"` -- connect to APNs/FCM directly; `"bouncer"` -- relay through external service |
| `bouncerUrl`   | URL of the push notification bouncer service (for `"bouncer"` mode) |
| `gcmApiKey`    | Firebase Cloud Messaging server key (for `"direct"` mode with Android) |
| `apnsCertPath` | Path to the APNs certificate file (for `"direct"` mode with iOS) |
| `apnsKeyId`    | APNs auth key ID (for `"direct"` mode with iOS, token-based auth) |
| `apnsTeamId`   | Apple Developer Team ID (for `"direct"` mode with iOS)       |
| `apnsBundleId` | iOS app bundle identifier (for `"direct"` mode with iOS)     |

## Repository Interface

```
registerToken(tenantId, userId, kind, token, iosAppId)
  -> Result<void>
```
Insert or update a push device token record. If a record with the same (tenant_id, user_id, token) already exists, update the `kind` and `ios_app_id` fields. This handles the case where a token is re-registered.

```
unregisterToken(tenantId, userId, token)
  -> Result<void>
```
Delete the push device token record matching (tenant_id, user_id, token). Returns success even if no matching record exists (idempotent).

```
getTokensForUser(tenantId, userId)
  -> Result<PushDeviceToken[]>
```
Fetch all registered push device tokens for a specific user.

```
removeAllTokensForUser(tenantId, userId)
  -> Result<void>
```
Delete all push device tokens for a user. Called when a user is deactivated.

```
getTokensByToken(token)
  -> Result<PushDeviceToken[]>
```
Fetch all records matching a specific token value across users. Used to clean up stale registrations when a token is re-registered by a different user (FCM/APNs can reassign tokens).

## Domain Functions

### registerDevice

Validate the token format: for Android GCM, the token should be a non-empty string; for APNs, the token should be a valid hex-encoded string. Check if the same token is registered to a different user -- if so, unregister it from the other user first (tokens are device-specific, not user-specific). Upsert the token via `registerToken`. Return success.

### unregisterDevice

Delete the token via `unregisterToken`. Return success regardless of whether the token existed.

### shouldSendPush

Determine whether a push notification should be sent for a given message to a given user. The decision depends on:
1. **Push mode** -- if `mode` is `"disabled"`, never send.
2. **Device tokens** -- the user must have at least one registered device token.
3. **Presence** -- the user must not have an active presence status (no recent heartbeat within the "offline" threshold, typically 5 minutes).
4. **User settings** -- check `enable_offline_push_notifications` (for messages when offline) and `enable_online_push_notifications` (for messages when online but idle).
5. **Muting** -- the target channel or topic must not be muted by the user.
6. **DM notifications** -- for DMs, check `enable_offline_push_notifications` is enabled.
7. **Channel notifications** -- for channel messages, check per-subscription push notification settings, falling back to the user's global `enable_stream_push_notifications` setting.
8. **Mentions** -- if the user is @-mentioned, push is sent regardless of channel notification settings (unless the channel is muted).

Returns a boolean indicating whether to send the push notification.

### sendPushNotification

Format the push notification payload for the target device type. The payload includes:
- `user_id` -- the recipient
- `message_id` -- the message that triggered the notification
- `sender_id`, `sender_email`, `sender_full_name` -- sender info
- `type` -- `"stream"` or `"private"`
- `stream` -- channel name (for channel messages)
- `topic` -- topic name (for channel messages)
- `content` -- truncated message content (first ~200 characters)
- `time` -- message timestamp

For `"direct"` mode: dispatch directly to APNs (via HTTP/2) or FCM (via HTTP API) based on the token's `kind`.

For `"bouncer"` mode: POST the notification payload to `{bouncerUrl}/api/v1/remotes/push/notify` with appropriate authentication headers.

Handle failures gracefully -- log errors but do not fail the original message send. If a token is rejected by APNs/FCM as invalid, unregister it via `unregisterToken`.

### sendTestNotification

Fetch all device tokens for the requesting user. Format a test notification payload with a standard test message. Dispatch to all registered devices. Return success with a count of devices notified.

## Events

No real-time events are emitted by this module. Push notifications are an outbound delivery mechanism, not part of the event queue system. The module consumes `message` events (from the messages module) and presence state (from the presence module) to decide when to dispatch push notifications.
