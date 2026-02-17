# Roles & Permissions Module

## Overview

The roles and permissions module defines Jotster's hierarchical role system and group-based permission evaluation. Every user in a tenant has a role (stored as an integer on the `user` table) that determines their base level of access. On top of this, organization settings control fine-grained permissions by mapping actions to user groups -- either system groups derived from role hierarchy, or custom user groups created by admins.

This module does not own dedicated REST endpoints. Roles are managed through the Users API (`PATCH /api/v1/users/{user_id}` with the `role` parameter) and permission settings through the Organization Settings API (`PATCH /api/v1/realm`). Instead, this module provides the permission-checking logic that every other module depends on when enforcing access control.

System groups are virtual groups whose membership is computed at query time from `user.role` rather than stored in a join table. When a tenant is created, system group records are inserted into the `user_group` table with `is_system_group=1`, but their membership is never materialized into `user_group_member`. Custom user groups, by contrast, store explicit membership rows.

Permission-controlled actions are stored as organization settings in `tenant.settings_json` (see the organization settings module). Each setting holds a reference to a user group. To check whether a user can perform an action, this module resolves the setting to a group, then evaluates whether the user is a member of that group -- either by role derivation for system groups or by explicit membership lookup for custom groups.

Package: `permissions`

## API Endpoints

This module has no dedicated API endpoints. Permission management is handled through existing endpoints in other modules.

### Role Management (via Users API)

| Method  | Path                        | Description                         | Defined In           |
| ------- | --------------------------- | ----------------------------------- | -------------------- |
| `PATCH` | `/api/v1/users/{user_id}`   | Update user role via `role` param   | `08-users.md`        |

### Permission Settings (via Organization Settings API)

| Method  | Path               | Description                                          | Defined In                    |
| ------- | ------------------ | ---------------------------------------------------- | ----------------------------- |
| `PATCH` | `/api/v1/realm`    | Update org permission settings (group-setting values) | `19-organization-settings.md` |

### Permission Checking (internal)

Other modules call into this module's domain functions to enforce access control before executing operations. For example, the channels module calls `canUserCreateChannel` before creating a channel, the messages module calls `canUserSendMessage` before posting, and the users module calls `isAtLeastRole` before allowing role changes.

## Data Model

This module does not define its own tables. It reads from tables owned by other modules.

### Tables Read (defined elsewhere)

#### `user` (defined in `08-users.md`)

The `role` column on the user table is the primary input for permission evaluation.

| Column      | Type    | Relevance                                                                    |
| ----------- | ------- | ---------------------------------------------------------------------------- |
| `id`        | TEXT    | User identifier                                                              |
| `tenant_id` | TEXT   | Tenant scope                                                                 |
| `role`      | INTEGER | Permission role: 100=owner, 200=admin, 300=moderator, 400=member, 600=guest  |
| `is_active` | INTEGER | Only active users participate in permission checks                           |
| `date_joined` | INTEGER | Used to determine full-member status                                       |

#### `user_group` (defined in `09-user-groups.md`)

System groups and custom groups are both stored here. System groups have `is_system_group=1` and use well-known `name` values prefixed with `role:`.

| Column           | Type    | Relevance                                                |
| ---------------- | ------- | -------------------------------------------------------- |
| `id`             | TEXT    | Group identifier, referenced by permission settings      |
| `tenant_id`      | TEXT    | Tenant scope                                             |
| `name`           | TEXT    | Group name; system groups use `role:` prefix             |
| `is_system_group` | INTEGER | 1 for system groups, 0 for custom groups                |

#### `user_group_member` (defined in `09-user-groups.md`)

Stores explicit membership for custom groups only. System group membership is never stored here -- it is computed from `user.role`.

| Column        | Type | Relevance                            |
| ------------- | ---- | ------------------------------------ |
| `user_group_id` | TEXT | The group                          |
| `user_id`     | TEXT | The member                           |

#### `tenant` (defined in `01-server-and-auth.md`, settings in `19-organization-settings.md`)

Organization-level permission settings are stored in `settings_json`.

| Column          | Type | Relevance                                              |
| --------------- | ---- | ------------------------------------------------------ |
| `id`            | TEXT | Tenant identifier                                      |
| `settings_json` | TEXT | JSON object containing permission setting key-value pairs |

#### `subscription` (defined in `07-subscriptions.md`)

Channel access checks require subscription data. Subscriptions use hard-delete semantics -- a row's existence means the user is subscribed.

| Column       | Type | Relevance                              |
| ------------ | ---- | -------------------------------------- |
| `tenant_id`  | TEXT | Tenant scope                           |
| `user_id`    | TEXT | Subscribed user                        |
| `channel_id` | TEXT | Subscribed channel                     |

#### `channel` (defined in `05-channels.md`)

Channel visibility determines access rules.

| Column         | Type    | Relevance                                  |
| -------------- | ------- | ------------------------------------------ |
| `id`           | TEXT    | Channel identifier                         |
| `tenant_id`    | TEXT    | Tenant scope                               |
| `is_private`   | INTEGER | Private channels require subscription      |
| `is_web_public` | INTEGER | Web-public channels are accessible to all |
| `is_archived`  | INTEGER | Archived channels reject new messages      |

#### `message` (defined in `03-messages.md`)

Message-level permission checks need message metadata.

| Column       | Type    | Relevance                                      |
| ------------ | ------- | ---------------------------------------------- |
| `id`         | TEXT    | Message identifier                             |
| `tenant_id`  | TEXT    | Tenant scope                                   |
| `sender_id`  | TEXT    | Who sent the message (for own-message checks)  |
| `channel_id` | TEXT    | Channel the message belongs to                 |
| `created_at` | INTEGER | Used for time-limited edit/delete windows      |

### Role Hierarchy

Roles are represented as integer codes. Lower numbers indicate higher privilege. The hierarchy is:

| Role                       | Code | Description                                                     |
| -------------------------- | ---- | --------------------------------------------------------------- |
| Organization Owner         | 100  | Full control including billing and ownership transfer            |
| Organization Administrator | 200  | Manage users, channels, settings (cannot promote to owner)      |
| Moderator                  | 300  | Extended permissions as configured by admins                     |
| Member                     | 400  | Default role for new users                                      |
| Guest                      | 600  | Limited access -- only sees channels they are subscribed to     |

Note: There is no role code 500. Guest is 600.

A role comparison of `roleA <= roleB` means "roleA is at least as privileged as roleB." For example, `100 <= 200` is true, meaning owners outrank admins.

### System Groups

System groups are created per-tenant at tenant initialization time. They are stored as `user_group` rows with `is_system_group=1`. Membership is NOT stored in `user_group_member` -- it is derived at query time from `user.role`.

| System Group Name    | Derived Membership                                                           |
| -------------------- | ---------------------------------------------------------------------------- |
| `role:everyone`      | All active users including guests                                            |
| `role:members`       | All active users with `role <= 400` (members, moderators, admins, owners)    |
| `role:fullmembers`   | Members who have been in the org longer than `waiting_period_threshold` days  |
| `role:moderators`    | All active users with `role <= 300` (moderators, admins, owners)             |
| `role:administrators` | All active users with `role <= 200` (admins, owners)                        |
| `role:owners`        | All active users with `role = 100`                                           |
| `role:internet`      | Pseudo-group for web-public access (no authentication needed)                |
| `role:nobody`        | Empty group (used to disable features entirely)                              |

### Group-Setting Values

Organization permission settings store a reference to a user group (by group ID). The group can be a system group or a custom user group. This is how Zulip's flexible permission model works -- instead of hardcoding "admins can do X," the setting says "group Y can do X," and group Y can be any group.

### Permission-Controlled Settings

These settings are stored in `tenant.settings_json` as key-value pairs where the value is a user group ID. Each setting controls who can perform a specific action.

| Setting Name                          | Description                                  | Default Group          |
| ------------------------------------- | -------------------------------------------- | ---------------------- |
| `create_public_stream_policy`         | Who can create public channels               | `role:members`         |
| `create_private_stream_policy`        | Who can create private channels              | `role:members`         |
| `create_web_public_stream_policy`     | Who can create web-public channels           | `role:owners`          |
| `invite_to_realm_policy`              | Who can invite users to the organization     | `role:members`         |
| `invite_to_stream_policy`             | Who can add users to channels                | `role:members`         |
| `move_messages_between_streams_policy` | Who can move messages between channels      | `role:members`         |
| `edit_topic_policy`                   | Who can edit message topics                  | `role:everyone`        |
| `wildcard_mention_policy`             | Who can use @all/@everyone mentions          | `role:members`         |
| `user_group_edit_policy`              | Who can manage user groups                   | `role:members`         |
| `can_create_groups`                   | Who can create user groups                   | `role:members`         |
| `can_manage_all_groups`               | Who can manage any user group                | `role:administrators`  |
| `can_add_custom_emoji`                | Who can add custom emoji                     | `role:members`         |
| `can_delete_any_message`              | Who can delete any message                   | `role:administrators`  |
| `can_delete_own_message`              | Who can delete their own messages            | `role:everyone`        |
| `can_access_all_users_group`          | Who can see all users (vs guest isolation)   | `role:everyone`        |
| `direct_message_permission_group`     | Who can send direct messages                 | `role:everyone`        |

## Repository Interface

### IPermissionRepository

```
getSystemGroups(tenantId: string) -> Result<UserGroup[]>
```
Returns the system groups (where `is_system_group=1`) for the given tenant. These are the auto-created groups with `role:` prefixed names. Used during permission evaluation to resolve setting values to system groups.

```
isUserInGroup(tenantId: string, userId: string, groupId: string) -> Result<boolean>
```
Checks whether a user is a member of a group. For system groups, this computes membership from the user's role (and `date_joined` for `role:fullmembers`). For custom groups, this checks the `user_group_member` table. Handles the special cases of `role:internet` (always true for web-public access checks where no user context exists) and `role:nobody` (always false).

The implementation performs the following steps:

1. Fetch the group record from `user_group` by `groupId`.
2. If `is_system_group=1`, derive membership based on the group name:
   - `role:everyone` -- return true if user is active.
   - `role:members` -- return true if `user.role <= 400` and user is active.
   - `role:fullmembers` -- return true if `user.role <= 400`, user is active, and `now - user.date_joined >= waiting_period_threshold_days * 86400000`.
   - `role:moderators` -- return true if `user.role <= 300` and user is active.
   - `role:administrators` -- return true if `user.role <= 200` and user is active.
   - `role:owners` -- return true if `user.role = 100` and user is active.
   - `role:internet` -- return true (unconditional).
   - `role:nobody` -- return false (unconditional).
3. If `is_system_group=0`, query `user_group_member` for a row matching `(groupId, userId)`. Return true if a row exists.

```
getPermissionSetting(tenantId: string, settingName: string) -> Result<string>
```
Reads a single permission setting value (a group ID) from `tenant.settings_json`. Returns the group ID associated with the given setting name. If the setting is not present in `settings_json`, returns the default group ID for that setting (looked up from the defaults table above).

```
getChannelForAccessCheck(tenantId: string, channelId: string) -> Result<{ isPrivate: boolean, isWebPublic: boolean, isArchived: boolean } | null>
```
Fetches the minimal channel fields needed for access checks. Returns null if the channel does not exist.

```
isUserSubscribedToChannel(tenantId: string, userId: string, channelId: string) -> Result<boolean>
```
Checks whether a user has an active subscription to the given channel.

```
getMessageForPermissionCheck(tenantId: string, messageId: string) -> Result<{ senderId: string, channelId: string | null, createdAt: number } | null>
```
Fetches the minimal message fields needed for edit/delete permission checks. Returns null if the message does not exist.

## Domain Functions

### isAtLeastRole

```
isAtLeastRole(userRole: number, requiredRole: number) -> boolean
```

Simple numeric comparison of role codes. Returns true if `userRole <= requiredRole`. Since lower codes mean higher privilege, `isAtLeastRole(100, 200)` returns true (owner is at least admin), while `isAtLeastRole(400, 200)` returns false (member is not at least admin).

This is a pure function with no I/O. It is used as a fast path for checks that only depend on the role hierarchy, without needing to resolve group-based permission settings.

### isFullMember

```
isFullMember(tenantId: string, user: { role: number, dateJoined: number }, waitingPeriodThresholdDays: number, now: number) -> boolean
```

Returns true if the user qualifies as a "full member." A full member is a non-guest user (`role <= 400`) who has been in the organization for at least `waitingPeriodThresholdDays` days. The check is:

1. If `user.role > 400` (guest), return false.
2. Compute the membership duration: `now - user.dateJoined`.
3. Compare against the threshold: `membershipDuration >= waitingPeriodThresholdDays * 86400000` (days to milliseconds).
4. Return the result.

When `waitingPeriodThresholdDays` is 0 (the default), all non-guest users are full members immediately.

This is a pure function. The `waitingPeriodThresholdDays` value comes from `tenant.settings_json`.

### checkPermission

```
checkPermission(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  settingName: string
) -> Result<boolean>
```

The core permission evaluation function. Given a user and a permission setting name, determines whether the user is in the allowed group for that setting.

1. Call `permissionRepo.getPermissionSetting(tenantId, settingName)` to get the group ID.
2. Call `permissionRepo.isUserInGroup(tenantId, userId, groupId)` to check membership.
3. Return the result.

This function is the single point of contact for all group-based permission checks. Other convenience functions in this module delegate to it.

### canUserAccessChannel

```
canUserAccessChannel(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<boolean>
```

Determines whether a user can view messages in a channel.

1. Fetch channel info via `permissionRepo.getChannelForAccessCheck(tenantId, channelId)`.
2. If the channel does not exist, return false.
3. If `isWebPublic` is true, return true (anyone can access).
4. If `isPrivate` is false (public channel), return true for any active non-guest user. For guests, check if they are subscribed.
5. If `isPrivate` is true, check if the user is subscribed via `permissionRepo.isUserSubscribedToChannel(tenantId, userId, channelId)`.
6. Return the result.

### canUserSendMessage

```
canUserSendMessage(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  channelId: string | null,
  topic: string | null
) -> Result<boolean>
```

Determines whether a user can post a message to a channel+topic or DM.

1. If `channelId` is null (DM), check the `direct_message_permission_group` setting via `checkPermission`.
2. If `channelId` is non-null (channel message):
   a. Verify the user can access the channel via `canUserAccessChannel`.
   b. Verify the channel is not archived via `permissionRepo.getChannelForAccessCheck`.
   c. If the channel is archived, return false.
   d. Return true if the user has access.

### canUserEditMessage

```
canUserEditMessage(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  messageId: string,
  editContentLimitSeconds: number,
  allowMessageEditing: boolean,
  now: number
) -> Result<boolean>
```

Determines whether a user can edit a specific message.

1. If `allowMessageEditing` is false (org setting), return false.
2. Fetch message info via `permissionRepo.getMessageForPermissionCheck(tenantId, messageId)`.
3. If the message does not exist, return false.
4. Load the user to get their role.
5. If the user is an admin (`role <= 200`), return true (admins can edit any message).
6. If the user is the message sender:
   a. If `editContentLimitSeconds` is 0, return true (no time limit).
   b. Compute elapsed time: `now - message.createdAt`.
   c. Return true if `elapsed <= editContentLimitSeconds * 1000`.
7. Otherwise, return false (non-admins cannot edit other users' messages).

### canUserDeleteMessage

```
canUserDeleteMessage(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  messageId: string,
  deleteContentLimitSeconds: number,
  now: number
) -> Result<boolean>
```

Determines whether a user can delete a specific message.

1. Fetch message info via `permissionRepo.getMessageForPermissionCheck(tenantId, messageId)`.
2. If the message does not exist, return false.
3. Check `can_delete_any_message` via `checkPermission`. If true, return true.
4. If the user is the message sender:
   a. Check `can_delete_own_message` via `checkPermission`. If false, return false.
   b. If `deleteContentLimitSeconds` is 0, return true (no time limit).
   c. Compute elapsed time: `now - message.createdAt`.
   d. Return true if `elapsed <= deleteContentLimitSeconds * 1000`.
5. Otherwise, return false.

### canUserInviteToOrg

```
canUserInviteToOrg(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can invite new users to the organization. Delegates to `checkPermission(permissionRepo, tenantId, userId, "invite_to_realm_policy")`.

### canUserCreateChannel

```
canUserCreateChannel(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  isPrivate: boolean,
  isWebPublic: boolean
) -> Result<boolean>
```

Determines whether a user can create a channel of the specified type.

1. If `isWebPublic` is true, check `create_web_public_stream_policy` via `checkPermission`.
2. If `isPrivate` is true, check `create_private_stream_policy` via `checkPermission`.
3. Otherwise (public, non-web-public), check `create_public_stream_policy` via `checkPermission`.
4. Return the result.

### canUserManageChannel

```
canUserManageChannel(
  permissionRepo: IPermissionRepository,
  userRepo: IUserRepository,
  channelRepo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<boolean>
```

Determines whether a user can modify channel settings (name, description, privacy). This includes renaming, changing visibility, and archiving.

1. Load the user to get their role.
2. If the user is an admin (`role <= 200`), return true.
3. Fetch the channel to check its `creator_id`.
4. If the channel does not exist, return false.
5. If the user is the channel creator and the organization setting allows creator management, return true.
6. Otherwise, return false.

### canUserManageUserGroup

```
canUserManageUserGroup(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string,
  groupId: string
) -> Result<boolean>
```

Determines whether a user can modify a user group (rename, change members, delete).

1. Check `can_manage_all_groups` via `checkPermission`. If true, return true.
2. Check `user_group_edit_policy` via `checkPermission`. If false, return false.
3. If the user passes the general edit policy, additionally verify they are a member or creator of the specific group (implementation depends on group ownership model in the user groups module).
4. Return the result.

### canUserUseWildcardMention

```
canUserUseWildcardMention(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can use @all, @everyone, or @stream wildcard mentions. Delegates to `checkPermission(permissionRepo, tenantId, userId, "wildcard_mention_policy")`.

### canUserMoveMessageBetweenChannels

```
canUserMoveMessageBetweenChannels(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can move messages from one channel to another. Delegates to `checkPermission(permissionRepo, tenantId, userId, "move_messages_between_streams_policy")`.

### canUserEditTopic

```
canUserEditTopic(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can edit message topics. Delegates to `checkPermission(permissionRepo, tenantId, userId, "edit_topic_policy")`.

### canUserAddCustomEmoji

```
canUserAddCustomEmoji(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can add custom emoji to the organization. Delegates to `checkPermission(permissionRepo, tenantId, userId, "can_add_custom_emoji")`.

### canUserAccessAllUsers

```
canUserAccessAllUsers(
  permissionRepo: IPermissionRepository,
  tenantId: string,
  userId: string
) -> Result<boolean>
```

Checks whether a user can see all users in the organization, or is restricted to only seeing users in their subscribed channels (guest isolation). Delegates to `checkPermission(permissionRepo, tenantId, userId, "can_access_all_users_group")`.

### initializeSystemGroups

```
initializeSystemGroups(
  userGroupRepo: IUserGroupRepository,
  tenantId: string
) -> Result<void>
```

Called during tenant creation (by the server/auth module) to create the system group records for the new tenant. Inserts one `user_group` row for each of the eight system groups with `is_system_group=1`.

1. For each system group name (`role:everyone`, `role:members`, `role:fullmembers`, `role:moderators`, `role:administrators`, `role:owners`, `role:internet`, `role:nobody`):
   a. Generate a nanoid for the group `id`.
   b. Insert a `user_group` row with `tenant_id`, `name`, `description` (human-readable), and `is_system_group=1`.
2. No `user_group_member` rows are created -- system group membership is computed dynamically.

This function is idempotent. If system groups already exist for the tenant (e.g., due to a retry), the insert is skipped for groups whose names already exist.

### initializeDefaultPermissionSettings

```
initializeDefaultPermissionSettings(
  tenantId: string,
  systemGroups: UserGroup[]
) -> Result<Record<string, string>>
```

Called during tenant creation, after system groups are initialized. Builds the default permission settings map by resolving system group names to their IDs.

1. Create a lookup map from system group name to group ID using the provided `systemGroups` array.
2. For each permission setting in the defaults table (e.g., `create_public_stream_policy` defaults to `role:members`), look up the corresponding system group ID.
3. Return a key-value map of setting names to group IDs. This map is stored in `tenant.settings_json`.

## Events

This module does not emit its own events. State changes that affect roles and permissions produce events through other modules:

| Trigger                          | Event Type    | Op       | Source Module              |
| -------------------------------- | ------------- | -------- | -------------------------- |
| User role changed                | `realm_user`  | `update` | Users (`08-users.md`)      |
| Permission setting changed       | `realm`       | `update` | Organization Settings (`19-organization-settings.md`) |

When a user's role is changed via `PATCH /api/v1/users/{user_id}`, the users module emits a `realm_user` event with `op: "update"` containing the new role value. All connected clients receive this event and can update their local permission state.

When a permission setting is changed via `PATCH /api/v1/realm`, the organization settings module emits a `realm` event with `op: "update"` containing the changed setting and its new value. Clients use this to update their understanding of what actions are permitted.
