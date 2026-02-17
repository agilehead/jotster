# 20 - Invitations

## Overview

The invitations module handles inviting new users to the organization. There are two invitation mechanisms: email invitations (sent to a specific address) and reusable invite links (shareable URLs that anyone can use to join).

Invitations carry metadata about which channels the new user should be auto-subscribed to and what role they should receive upon joining. Email invitations are one-time-use and tied to a specific email address, while multiuse invite links can be used by multiple people.

Invitation permissions are governed by the org's `invite_to_realm_policy` setting, which controls which roles can send invitations. Email sending is out of scope for MVP -- the module creates invitation records and tokens, but the actual email dispatch is deferred to a separate email service (or manual sharing of the invite URL).

Package: `organization`

## API Endpoints

| Method | Path                                        | Description                                          |
| ------ | ------------------------------------------- | ---------------------------------------------------- |
| GET    | /api/v1/invites                             | List all unexpired invitations for the organization  |
| POST   | /api/v1/invites                             | Send email invitations to one or more addresses      |
| POST   | /api/v1/invites/multiuse                    | Create a reusable invite link                        |
| POST   | /api/v1/invites/{invite_id}/resend          | Resend an invitation email                           |
| DELETE | /api/v1/invites/{invite_id}                 | Revoke an email invitation                           |
| DELETE | /api/v1/invites/multiuse/{invite_id}        | Revoke a reusable invite link                        |

### GET /api/v1/invites

Returns all active invitations (pending and not expired) for the organization. Only organization administrators and users who created invitations can view the full list.

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "invites": [
    {
      "id": "inv_abc123",
      "invited_by_user_id": "user_1",
      "invited_as": 400,
      "email": "newuser@example.com",
      "is_multiuse": false,
      "link_url": "https://org.example.com/join/token123",
      "streams": ["channel_id_1", "channel_id_2"],
      "status": "pending",
      "invited_at": 1700000000
    }
  ]
}
```

### POST /api/v1/invites

Send email invitations. Creates one invitation record per email address.

**Request parameters:**
- `invitee_emails` (string) -- comma-separated email addresses
- `stream_ids` (string) -- JSON array of channel IDs to auto-subscribe
- `invite_as` (int) -- role to assign: 100 (owner), 200 (admin), 300 (moderator), 400 (member), 600 (guest)
- `invite_expires_in_minutes` (int, optional) -- expiry time in minutes (null = no expiry)

**Response:**
```json
{
  "result": "success",
  "msg": ""
}
```

### POST /api/v1/invites/multiuse

Create a reusable invite link that can be shared and used by multiple people.

**Request parameters:**
- `stream_ids` (string) -- JSON array of channel IDs to auto-subscribe
- `invite_as` (int) -- role to assign
- `invite_expires_in_minutes` (int, optional) -- expiry time in minutes

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "invite_link": "https://org.example.com/join/token456"
}
```

### POST /api/v1/invites/{invite_id}/resend

Resend the invitation email for a pending email invitation. Only the original inviter or an admin can resend.

### DELETE /api/v1/invites/{invite_id}

Revoke an email invitation. Sets the status to `"revoked"`. Only the original inviter or an admin can revoke.

### DELETE /api/v1/invites/multiuse/{invite_id}

Revoke a reusable invite link. Sets the status to `"revoked"`.

## Data Model

### `invitation`

| Column            | Type   | Constraints                              | Description                              |
| ----------------- | ------ | ---------------------------------------- | ---------------------------------------- |
| id                | string | PK                                       | Nanoid                                   |
| tenant_id         | string | FK -> tenant, NOT NULL                   | Tenant scope                             |
| inviter_id        | string | FK -> user, NOT NULL                     | The user who created the invitation      |
| email             | string | nullable                                 | Target email address (null for multiuse) |
| is_multiuse       | int    | NOT NULL, default 0                      | 1 for reusable invite links, 0 for email invites |
| link_token        | string | NOT NULL, UNIQUE                         | The invite token/code used in the URL    |
| channel_ids_json  | text   | NOT NULL, default "[]"                   | JSON array of channel IDs for auto-subscribe |
| invited_as_role   | int    | NOT NULL, default 400                    | Role code: 100=owner, 200=admin, 300=moderator, 400=member, 600=guest |
| status            | string | NOT NULL, default "pending"              | `"pending"`, `"accepted"`, `"revoked"`, `"expired"` |
| created_at        | int    | NOT NULL                                 | Unix milliseconds                        |
| expires_at        | int    | nullable                                 | Unix milliseconds (null = no expiry)     |

**Indexes:**

| Name                                | Columns                                                      | Purpose                              |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| uq_invitation_token                 | (link_token)                                                 | UNIQUE -- each token is globally unique |
| uq_invitation_pending_email         | (tenant_id, email) WHERE status = 'pending' AND is_multiuse = 0 | UNIQUE -- one pending invite per email per tenant |
| ix_invitation_tenant_status         | (tenant_id, status)                                          | List active invitations for a tenant |
| ix_invitation_inviter               | (tenant_id, inviter_id)                                      | List invitations created by a user   |

## Repository Interface

```
getInvitations(tenantId)
  -> Result<Invitation[]>
```
Fetch all invitations for the tenant that are not expired or revoked. For invitations with an `expires_at` in the past, they should be treated as expired. Ordered by `created_at` descending.

```
createInvitation(tenantId, inviterId, email, channelIds, role, expiresAt)
  -> Result<Invitation>
```
Insert a new email invitation record with `is_multiuse = 0` and `status = "pending"`. Generate a unique `link_token`. Returns the created invitation. Fails if a pending invitation for the same email already exists in the tenant.

```
createMultiuseInvitation(tenantId, inviterId, channelIds, role, expiresAt)
  -> Result<Invitation>
```
Insert a new multiuse invitation record with `is_multiuse = 1`, `email = null`, and `status = "pending"`. Generate a unique `link_token`. Returns the created invitation.

```
getInvitationByToken(token)
  -> Result<Invitation | null>
```
Look up an invitation by its `link_token`. Returns null if not found. Does not filter by tenant -- the token is globally unique.

```
getInvitationById(tenantId, invitationId)
  -> Result<Invitation | null>
```
Fetch a specific invitation by ID within the tenant.

```
revokeInvitation(tenantId, invitationId)
  -> Result<void>
```
Set the invitation status to `"revoked"`. Fails if the invitation is not in `"pending"` status.

```
acceptInvitation(tenantId, invitationId, userId)
  -> Result<void>
```
Set the invitation status to `"accepted"`. For email invitations, this is a one-time operation. For multiuse invitations, the status remains `"pending"` (multiuse links are not consumed).

## Domain Functions

### sendInvitations

Validate that the requesting user has permission to invite users, based on the org's `invite_to_realm_policy` setting. Validate each email address format. Check that none of the email addresses belong to existing users in the organization. Check that no pending invitation already exists for each email. For each email, generate a unique `link_token` (nanoid), compute `expires_at` from `invite_expires_in_minutes`, and create an invitation record via `createInvitation`. The invite URL is `https://{subdomain}.{domain}/join/{link_token}`. Email dispatch is out of scope for MVP -- the records and tokens are created, and the invite URLs are returned in the response. Emit an `invites_changed` event.

### createMultiuseLink

Validate that the requesting user has permission to invite users. Generate a unique `link_token`. Compute `expires_at` from `invite_expires_in_minutes`. Create the multiuse invitation via `createMultiuseInvitation`. Return the invite URL. Emit an `invites_changed` event.

### revokeInvitation

Validate that the requesting user is the original inviter or an organization administrator. Look up the invitation by ID. Validate that it is in `"pending"` status. Update the status to `"revoked"` via `revokeInvitation` on the repository. Emit an `invites_changed` event.

### acceptInvitation

Look up the invitation by its `link_token` via `getInvitationByToken`. Validate that the invitation is in `"pending"` status and has not expired (check `expires_at` against current time). If the invitation is an email invitation, validate that the accepting user's email matches the invitation email. Create the user account with the role specified in `invited_as_role`. Auto-subscribe the new user to the channels listed in `channel_ids_json`. For email invitations, mark the invitation as `"accepted"` via `acceptInvitation` on the repository. Emit an `invites_changed` event and a `realm_user` event for the new user.

## Events

### `invites_changed`

Emitted when the invitation list changes (invitation created, revoked, or accepted). This is a simple notification event -- clients that display the invitation list should refetch it.

Contains:
- `type`: `"invites_changed"`
