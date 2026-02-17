# 11 - Presence

## Overview

The presence module tracks whether users are active, idle, or offline. Zulip clients report their presence status periodically (typically every 60 seconds), and the server aggregates these reports to provide a real-time view of user availability across the organization.

Each user can have multiple presence entries -- one per client (e.g., "website", "ZulipMobile", "ZulipTerminal"). The aggregated presence is computed from all active client entries: if ANY client reports "active", the user is considered active. If all clients report "idle", the user is idle. If no client has reported within a configurable threshold (default 5 minutes), the user is offline.

The module supports both the legacy per-client presence format and the modern "slim" presence format, which returns only aggregated timestamps per user.

Package: `presence`

## API Endpoints

| Method | Path                                       | Auth Required | Description                                      |
| ------ | ------------------------------------------ | ------------- | ------------------------------------------------ |
| `POST` | `/api/v1/users/me/presence`                | Yes           | Report the authenticated user's presence status  |
| `GET`  | `/api/v1/users/{user_id_or_email}/presence`| Yes           | Get a specific user's presence                   |
| `GET`  | `/api/v1/realm/presence`                   | Yes           | Get presence for all users in the organization   |

### Endpoint Details

#### POST /api/v1/users/me/presence

Called periodically by Zulip clients (typically every 60 seconds) to report the user's current activity status.

**Request (form-encoded):**

| Parameter   | Type    | Required | Description                                                       |
| ----------- | ------- | -------- | ----------------------------------------------------------------- |
| `status`    | string  | Yes      | `"active"` or `"idle"`                                            |
| `client`    | string  | Yes      | Client name, e.g., `"website"`, `"ZulipMobile"`, `"ZulipTerminal"` |
| `ping_only` | boolean | No       | If true, update timestamp without changing status                 |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "server_timestamp": 1739800000.0,
  "presences": {
    "user@example.com": {
      "aggregated": {
        "status": "active",
        "timestamp": 1739800000
      },
      "website": {
        "status": "active",
        "timestamp": 1739800000,
        "client": "website"
      }
    }
  },
  "presence_last_update_id": 42
}
```

When `ping_only` is true, the server updates the timestamp for the user's client entry but does not change the recorded status. This is used to keep the session alive without overriding a previously set status.

#### GET /api/v1/users/{user_id_or_email}/presence

Returns the presence status for a specific user. The path parameter can be a user ID or email address.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "presence": {
    "aggregated": {
      "status": "active",
      "timestamp": 1739800000
    },
    "website": {
      "status": "active",
      "timestamp": 1739800000,
      "client": "website"
    }
  }
}
```

If the user has no recent presence entries (all older than the offline threshold), the aggregated status is `"offline"`.

#### GET /api/v1/realm/presence

Returns presence data for all non-offline users in the organization. This endpoint is used by clients to populate the user sidebar presence indicators.

**Response (200) -- legacy format:**

```json
{
  "result": "success",
  "msg": "",
  "server_timestamp": 1739800000.0,
  "presences": {
    "user@example.com": {
      "aggregated": {
        "status": "active",
        "timestamp": 1739800000
      },
      "website": {
        "status": "active",
        "timestamp": 1739800000,
        "client": "website"
      }
    }
  }
}
```

**Slim presence format** (modern, preferred -- used when `slim_presence` is true in event queue registration):

```json
{
  "result": "success",
  "msg": "",
  "server_timestamp": 1739800000.0,
  "presences": {
    "u_abc123": {
      "active_timestamp": 1739800000,
      "idle_timestamp": 1739799940
    }
  }
}
```

In the slim format, keys are user IDs (not emails), and each entry has `active_timestamp` (the most recent "active" report across all clients) and `idle_timestamp` (the most recent "idle" report across all clients). Either field may be absent if no report of that status exists.

### Presence Computation

- **Active**: At least one client has reported `"active"` within the offline threshold (default 300 seconds / 5 minutes).
- **Idle**: All client reports are `"idle"` and at least one is within the offline threshold.
- **Offline**: No client has reported within the offline threshold. Offline users are excluded from the `GET /realm/presence` response.

The offline threshold is configurable per-organization but defaults to 300 seconds (5 minutes). The client reporting interval is typically 60 seconds.

## Data Model

### `presence`

Tracks per-client presence status for each user. Each row represents one client's most recent presence report.

| Column        | Type    | Constraints                              | Description                                               |
| ------------- | ------- | ---------------------------------------- | --------------------------------------------------------- |
| `user_id`     | TEXT    | NOT NULL, FK -> user                     | The user whose presence is being tracked                  |
| `tenant_id`   | TEXT    | NOT NULL, FK -> tenant                   | Tenant scope                                              |
| `client_name` | TEXT    | NOT NULL                                 | Client identifier (e.g., `"website"`, `"ZulipMobile"`)   |
| `status`      | TEXT    | NOT NULL                                 | `"active"` or `"idle"`                                    |
| `timestamp`   | INTEGER | NOT NULL                                 | Unix milliseconds of the last update                      |

**Primary Key:** `(user_id, client_name)`

**Indexes:**

| Name                       | Columns                      | Purpose                                         |
| -------------------------- | ---------------------------- | ----------------------------------------------- |
| ix_presence_tenant         | (tenant_id, timestamp)       | Fetch all presences for a tenant, filter by age |
| ix_presence_user           | (tenant_id, user_id)         | Fetch all client entries for a specific user    |

**Notes:**

- This table uses a composite primary key `(user_id, client_name)` rather than a nanoid `id` column because each row is uniquely identified by which user and which client it represents. Inserts are upserts -- if a row already exists for the (user, client) pair, it is updated in place.
- The `tenant_id` column is included for multi-tenant query scoping even though `user_id` already implies a tenant. This avoids a join on the `user` table for tenant-scoped queries.

## Repository Interface

```
updatePresence(tenantId: string, userId: string, clientName: string, status: string, timestamp: int64)
  -> Result<void>
```
Upsert a presence row for the given (userId, clientName) pair. If a row exists, update `status` and `timestamp`. If not, insert a new row.

```
getPresence(tenantId: string, userId: string)
  -> Result<PresenceEntry[]>
```
Fetch all presence entries for a specific user within the tenant. Returns one entry per client.

```
getAllPresences(tenantId: string)
  -> Result<Map<string, PresenceEntry[]>>
```
Fetch all presence entries for all users in the tenant. Returns a map keyed by user ID, where each value is an array of per-client entries. Used by the `GET /realm/presence` endpoint.

```
cleanupStalePresences(tenantId: string, olderThan: int64)
  -> Result<void>
```
Delete all presence entries with a `timestamp` older than the given threshold. Called periodically to clean up entries from users who have gone offline without sending a "stop" signal.

## Domain Functions

### updatePresence

```
updatePresence(
  repo: IPresenceRepository,
  tenantId: string,
  userId: string,
  clientName: string,
  status: string,
  pingOnly: boolean,
  timestamp: int64
) -> Result<PresenceResult>
```

1. Validate that `status` is `"active"` or `"idle"`.
2. If `pingOnly` is true, fetch the current entry for this (user, client) pair. If it exists, use its existing status instead of the provided one. If no entry exists, use the provided status.
3. Upsert the presence entry via the repository.
4. Compute the aggregated presence for the user (across all clients).
5. Compare the new aggregated status to the previous one. If changed, emit a `presence` event.
6. Return the user's current presence data.

### getAggregatedPresence

```
getAggregatedPresence(
  entries: PresenceEntry[],
  offlineThresholdMs: int64,
  now: int64
) -> AggregatedPresence
```

Given a list of per-client presence entries for a user, compute the aggregated status:
1. Filter out entries older than `offlineThresholdMs` from `now`.
2. If no entries remain, the user is `"offline"`.
3. If any remaining entry has `status = "active"`, the aggregated status is `"active"`. The `active_timestamp` is the most recent timestamp among "active" entries.
4. Otherwise, the aggregated status is `"idle"`. The `idle_timestamp` is the most recent timestamp among "idle" entries.
5. Return the aggregated status along with `active_timestamp` and `idle_timestamp` (both optional, present only if at least one entry of that status exists within the threshold).

### isUserOnline

```
isUserOnline(
  repo: IPresenceRepository,
  tenantId: string,
  userId: string,
  offlineThresholdMs: int64,
  now: int64
) -> Result<boolean>
```

Check if the user has any presence entry within the offline threshold. Returns true if the user is either "active" or "idle" (i.e., not offline). Used by other modules to quickly check user availability.

## Events

### `presence`

Emitted when a user's aggregated presence status changes (e.g., from idle to active, or from active to offline after cleanup). Delivered to all active users in the tenant.

**Payload:**

```json
{
  "type": "presence",
  "user_id": "u_abc123",
  "email": "user@example.com",
  "presence": {
    "website": {
      "status": "active",
      "timestamp": 1739800000,
      "client": "website"
    }
  },
  "server_timestamp": 1739800000.0
}
```

**Slim format payload** (when `slim_presence` is enabled):

```json
{
  "type": "presence",
  "user_id": "u_abc123",
  "presence": {
    "active_timestamp": 1739800000,
    "idle_timestamp": 1739799940
  },
  "server_timestamp": 1739800000.0
}
```

**Notes:**

- Presence events are only emitted when the aggregated status changes, not on every client ping. This avoids flooding clients with redundant updates.
- The `server_timestamp` is Unix seconds (float), matching Zulip's convention for event timestamps.
- The `presence_last_update_id` returned in the POST response is a monotonically increasing sequence number that clients can use to detect missed updates.
