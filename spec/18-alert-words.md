# 18 - Alert Words

## Overview

The alert words module allows users to configure keywords that trigger special notifications when they appear in any message. When a message is sent, the server checks its content against every user's alert words. If a match is found, the `has_alert_word` flag is set on the message for that user, triggering a visual highlight and notification.

Alert words are case-insensitive and match on whole-word boundaries. For example, if a user has the alert word "deploy", it would match "deploy" and "Deploy" but not "deployment" or "redeploy". The matching is performed during message send time and the results are stored as message flags.

Each user manages their own list of alert words. The list is private -- other users cannot see what alert words someone has configured.

Package: `notifications`

## API Endpoints

| Method   | Path                            | Auth Required | Description                       |
| -------- | ------------------------------- | ------------- | --------------------------------- |
| `GET`    | `/api/v1/users/me/alert_words` | Yes           | List the user's alert words       |
| `POST`   | `/api/v1/users/me/alert_words` | Yes           | Add alert words to the user's list|
| `DELETE` | `/api/v1/users/me/alert_words` | Yes           | Remove alert words from the list  |

### Endpoint Details

#### GET /api/v1/users/me/alert_words

Returns the authenticated user's complete list of alert words.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "alert_words": ["deploy", "outage", "security"]
}
```

The list is returned in alphabetical order.

#### POST /api/v1/users/me/alert_words

Adds one or more alert words to the user's list. Words that already exist are silently ignored (no error).

**Request (form-encoded):**

| Parameter     | Type   | Required | Description                          |
| ------------- | ------ | -------- | ------------------------------------ |
| `alert_words` | string | Yes      | JSON array of strings to add         |

**Example request body:**

```
alert_words=["deploy", "incident"]
```

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "alert_words": ["deploy", "incident", "outage", "security"]
}
```

Returns the user's complete updated list of alert words (not just the newly added ones).

#### DELETE /api/v1/users/me/alert_words

Removes one or more alert words from the user's list. Words that are not in the list are silently ignored (no error).

**Request (form-encoded):**

| Parameter     | Type   | Required | Description                          |
| ------------- | ------ | -------- | ------------------------------------ |
| `alert_words` | string | Yes      | JSON array of strings to remove      |

**Example request body:**

```
alert_words=["outage"]
```

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "alert_words": ["deploy", "incident", "security"]
}
```

Returns the user's complete updated list of alert words after removal.

## Data Model

### `alert_word`

Stores individual alert words for each user.

| Column       | Type    | Constraints                            | Description                                   |
| ------------ | ------- | -------------------------------------- | --------------------------------------------- |
| `id`         | TEXT    | PK                                     | System-generated nanoid                       |
| `tenant_id`  | TEXT    | NOT NULL, FK -> tenant                 | Tenant scope                                  |
| `user_id`    | TEXT    | NOT NULL, FK -> user                   | The user who configured this alert word       |
| `word`       | TEXT    | NOT NULL                               | The alert word, stored lowercase              |
| `created_at` | INTEGER | NOT NULL                               | Unix milliseconds                             |

**Indexes:**

| Name                         | Columns                          | Purpose                                         |
| ---------------------------- | -------------------------------- | ----------------------------------------------- |
| uq_alert_word_unique         | (tenant_id, user_id, word)       | UNIQUE -- prevents duplicate words per user      |
| ix_alert_word_user           | (tenant_id, user_id)             | Fetch all alert words for a user                 |
| ix_alert_word_tenant         | (tenant_id)                      | Fetch all alert words in a tenant (for message scanning) |

**Notes:**

- Words are normalized to lowercase before storage. The uniqueness constraint on `(tenant_id, user_id, word)` prevents duplicate entries.
- The `ix_alert_word_tenant` index supports the message-send path, where the server needs to load all alert words across all users in the tenant to check against the message content.

## Repository Interface

```
getAlertWords(tenantId: string, userId: string)
  -> Result<string[]>
```
Fetch all alert words for the given user, returned as a sorted array of lowercase strings.

```
addAlertWords(tenantId: string, userId: string, words: string[], createdAt: int64)
  -> Result<string[]>
```
Insert new alert word records for the given words. Words that already exist for the user are silently skipped (upsert semantics). Returns the user's complete updated list of alert words.

```
removeAlertWords(tenantId: string, userId: string, words: string[])
  -> Result<string[]>
```
Delete alert word records matching the given words for the user. Words that do not exist are silently ignored. Returns the user's complete updated list of alert words.

```
getAllAlertWords(tenantId: string)
  -> Result<Map<string, string[]>>
```
Fetch all alert words for all users in the tenant. Returns a map keyed by user ID, where each value is the user's list of alert words. Used during message send to check the message content against all users' alert words in a single query.

## Domain Functions

### addAlertWords

```
addAlertWords(
  repo: IAlertWordRepository,
  tenantId: string,
  userId: string,
  words: string[]
) -> Result<string[]>
```

1. Normalize all input words to lowercase and trim whitespace.
2. Deduplicate the input list (remove duplicates within the same request).
3. Filter out empty strings.
4. Persist the new words via the repository. Existing words are silently skipped.
5. Fetch the user's complete updated alert word list.
6. Emit an `alert_words` event to the user's event queues.
7. Return the complete list.

### removeAlertWords

```
removeAlertWords(
  repo: IAlertWordRepository,
  tenantId: string,
  userId: string,
  words: string[]
) -> Result<string[]>
```

1. Normalize all input words to lowercase and trim whitespace.
2. Delete matching words via the repository. Non-existent words are silently ignored.
3. Fetch the user's complete updated alert word list.
4. Emit an `alert_words` event to the user's event queues.
5. Return the complete list.

### checkMessageForAlertWords

```
checkMessageForAlertWords(
  content: string,
  alertWordsByUser: Map<string, string[]>
) -> Map<string, string[]>
```

Pure function called during the message send path. Given the raw message content and a map of all users' alert words in the tenant:

1. Normalize the message content to lowercase for matching.
2. For each user's alert word list, check if any word matches in the content using whole-word boundary matching.
3. A "whole word" match means the alert word is surrounded by word boundaries (spaces, punctuation, start/end of string). For example, the word "deploy" matches in "time to deploy!" but not in "deployment".
4. Return a map of user ID to the list of matched alert words for that user. Users with no matches are omitted from the map.

The caller (message send domain function) uses this result to:
- Set the `has_alert_word` flag on the message for each user who has a match.
- Include alert word match information in the message event payload so clients can highlight the matched words.

### getAlertWordsForUser

```
getAlertWordsForUser(
  repo: IAlertWordRepository,
  tenantId: string,
  userId: string
) -> Result<string[]>
```

Simple fetch of the user's alert words. Returns a sorted array of lowercase strings. Used by the `GET /users/me/alert_words` endpoint.

## Events

### `alert_words`

Emitted when the user's alert word list changes (words added or removed). Delivered only to the user whose list changed (across all their connected clients).

**Payload:**

```json
{
  "type": "alert_words",
  "alert_words": ["deploy", "incident", "security"]
}
```

The payload contains the complete current list of alert words (not a diff). This allows clients to simply replace their local list with the server's authoritative list.

**Notes:**

- Alert word events are user-private. Other users are never notified about changes to someone's alert word list.
- The `has_alert_word` flag on messages is delivered as part of the `message` event's `flags` array (see the messages module, spec `03-messages.md`). The alert words module is responsible for computing which users should receive this flag, but the flag itself is stored and delivered through the message flags system.
- Alert word matching during message send is performed against all users in the tenant, not just the message recipients. This means if user A has the alert word "deploy" and is subscribed to a channel where a message containing "deploy" is posted, user A will see the alert even if they were not explicitly mentioned.
