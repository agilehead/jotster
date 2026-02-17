# User Groups Module

## Overview

User groups are named collections of users used for permissions and @-mentions. When a user @-mentions a group (e.g., `@backend-team`), all members of that group are notified. Groups also serve as permission targets -- for example, an organization can configure "only members of the @admins group can create channels."

Groups support hierarchical composition via subgroups. A group can contain other groups as subgroups, and membership is computed recursively. For example, if `@engineering` contains `@backend-team` and `@frontend-team` as subgroups, then @-mentioning `@engineering` notifies all members of both subgroups.

Each tenant has a set of **system groups** that are automatically created and cannot be deleted. System groups have `is_system_group=1` and their membership is derived from user roles, not from explicit membership in the `user_group_member` table. The system groups are:

- `role:everyone` -- all users (including guests)
- `role:members` -- all non-guest users (role <= 400)
- `role:fullmembers` -- members who have been in the organization long enough (configurable)
- `role:moderators` -- moderators, admins, and owners (role <= 300)
- `role:administrators` -- admins and owners (role <= 200)
- `role:owners` -- owners only (role = 100)

Groups also have permission properties that control who can manage the group itself: `can_add_members_group_id`, `can_join_group_id`, `can_leave_group_id`, `can_manage_group_id`, and `can_mention_group_id`. Each of these is a foreign key to another user group, enabling fine-grained access control.

## API Endpoints

### Zulip-Compatible Endpoints

| Method | Path                                          | Auth Required | Description                              |
| ------ | --------------------------------------------- | ------------- | ---------------------------------------- |
| `GET`  | `/api/v1/user_groups`                         | Yes           | List all user groups                     |
| `POST` | `/api/v1/user_groups/create`                  | Yes           | Create a new group                       |
| `PATCH`| `/api/v1/user_groups/{group_id}`              | Yes           | Update group name/description            |
| `POST` | `/api/v1/user_groups/{group_id}/deactivate`   | Yes           | Deactivate a group                       |
| `POST` | `/api/v1/user_groups/{group_id}/members`      | Yes           | Add or remove members                    |
| `GET`  | `/api/v1/user_groups/{group_id}/members`      | Yes           | List group members                       |
| `GET`  | `/api/v1/user_groups/{group_id}/members/{user_id}` | Yes      | Check if user is a member                |
| `POST` | `/api/v1/user_groups/{group_id}/subgroups`    | Yes           | Add or remove subgroups                  |
| `GET`  | `/api/v1/user_groups/{group_id}/subgroups`    | Yes           | List subgroups                           |

### Endpoint Details

#### GET /api/v1/user_groups

Returns all user groups (both system and custom) in the tenant.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "user_groups": [
    {
      "id": "ug_abc123",
      "name": "role:everyone",
      "description": "Everyone in the organization",
      "is_system_group": true,
      "can_add_members_group": "ug_sys_admins",
      "can_join_group": "ug_sys_nobody",
      "can_leave_group": "ug_sys_nobody",
      "can_manage_group": "ug_sys_admins",
      "can_mention_group": "ug_sys_everyone",
      "members": [],
      "direct_subgroup_ids": []
    },
    {
      "id": "ug_xyz789",
      "name": "backend-team",
      "description": "Backend engineering team",
      "is_system_group": false,
      "can_add_members_group": "ug_sys_admins",
      "can_join_group": "ug_sys_nobody",
      "can_leave_group": "ug_sys_nobody",
      "can_manage_group": "ug_sys_admins",
      "can_mention_group": "ug_sys_everyone",
      "members": ["u_user1", "u_user2"],
      "direct_subgroup_ids": []
    }
  ]
}
```

#### POST /api/v1/user_groups/create

Creates a new custom user group.

**Request (form-encoded):**

| Parameter     | Type     | Required | Description                       |
| ------------- | -------- | -------- | --------------------------------- |
| `name`        | string   | Yes      | Group name (must be unique)       |
| `description` | string   | Yes      | Group description                 |
| `members`     | int[]    | Yes      | JSON array of user IDs to add     |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Group name already exists, or invalid member IDs.

#### PATCH /api/v1/user_groups/{group_id}

Update a group's name or description. Cannot modify system groups.

**Request (form-encoded):**

| Parameter     | Type   | Required | Description          |
| ------------- | ------ | -------- | -------------------- |
| `name`        | string | No       | New group name       |
| `description` | string | No       | New group description|

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Cannot modify system groups, or name already in use.

#### POST /api/v1/user_groups/{group_id}/deactivate

Deactivates a user group. System groups cannot be deactivated. Deactivated groups are no longer available for @-mentions or permission assignments, but their data is preserved.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Cannot deactivate system groups, or group is already deactivated.

#### POST /api/v1/user_groups/{group_id}/members

Add or remove members from a group. Cannot modify system group membership (system group membership is derived from user roles).

**Request (form-encoded):**

| Parameter | Type  | Required | Description                        |
| --------- | ----- | -------- | ---------------------------------- |
| `add`     | int[] | No       | JSON array of user IDs to add      |
| `delete`  | int[] | No       | JSON array of user IDs to remove   |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### GET /api/v1/user_groups/{group_id}/members

Returns the list of direct member user IDs in the group.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "members": ["u_user1", "u_user2"]
}
```

#### GET /api/v1/user_groups/{group_id}/members/{user_id}

Check whether a specific user is a member of the group (including transitive membership via subgroups).

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "is_user_group_member": true
}
```

#### POST /api/v1/user_groups/{group_id}/subgroups

Add or remove subgroups from a group.

**Request (form-encoded):**

| Parameter | Type  | Required | Description                           |
| --------- | ----- | -------- | ------------------------------------- |
| `add`     | int[] | No       | JSON array of group IDs to add        |
| `delete`  | int[] | No       | JSON array of group IDs to remove     |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Adding a subgroup would create a circular dependency.

#### GET /api/v1/user_groups/{group_id}/subgroups

Returns the list of direct subgroup IDs.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subgroups": ["ug_sub1", "ug_sub2"]
}
```

## Data Model

### user_group

Stores user group definitions. Both system groups and custom groups live in this table.

| Column                     | Type    | Constraints                    | Description                                                    |
| -------------------------- | ------- | ------------------------------ | -------------------------------------------------------------- |
| `id`                       | TEXT    | PK                             | System-generated nanoid                                        |
| `tenant_id`                | TEXT    | NOT NULL, FK -> tenant         | Owning tenant                                                  |
| `name`                     | TEXT    | NOT NULL                       | Group name (unique within tenant)                              |
| `description`              | TEXT    | NOT NULL DEFAULT ''            | Human-readable description                                     |
| `is_system_group`          | INTEGER | NOT NULL DEFAULT 0             | Boolean 0/1, whether this is a system-managed group            |
| `can_add_members_group_id` | TEXT    | NULL, FK -> user_group         | Group whose members can add members to this group              |
| `can_join_group_id`        | TEXT    | NULL, FK -> user_group         | Group whose members can join this group                        |
| `can_leave_group_id`       | TEXT    | NULL, FK -> user_group         | Group whose members can leave this group                       |
| `can_manage_group_id`      | TEXT    | NULL, FK -> user_group         | Group whose members can manage (edit) this group               |
| `can_mention_group_id`     | TEXT    | NULL, FK -> user_group         | Group whose members can @-mention this group                   |
| `is_active`                | INTEGER | NOT NULL DEFAULT 1             | Boolean 0/1, whether group is active                           |
| `created_at`               | INTEGER | NOT NULL                       | Unix milliseconds                                              |
| `updated_at`               | INTEGER | NOT NULL                       | Unix milliseconds                                              |

**Constraints:**

- UNIQUE (`tenant_id`, `name`) -- no duplicate group names within a tenant.

**Indexes:**

- `ix_user_group_tenant` on `(tenant_id)` -- list all groups for a tenant.
- `ix_user_group_tenant_name` on `(tenant_id, name)` -- look up group by name.

### user_group_member

Join table mapping users to groups. Only used for custom groups; system group membership is derived from user roles.

| Column          | Type | Constraints            | Description                     |
| --------------- | ---- | ---------------------- | ------------------------------- |
| `user_group_id` | TEXT | NOT NULL, FK -> user_group | Group the user belongs to   |
| `user_id`       | TEXT | NOT NULL, FK -> user   | User who is a member            |

**Constraints:**

- PRIMARY KEY (`user_group_id`, `user_id`)

**Indexes:**

- `ix_user_group_member_user` on `(user_id)` -- find all groups a user belongs to.

### user_group_subgroup

Join table for hierarchical group composition. Maps parent groups to their direct subgroups.

| Column            | Type | Constraints                | Description                  |
| ----------------- | ---- | -------------------------- | ---------------------------- |
| `parent_group_id` | TEXT | NOT NULL, FK -> user_group | Parent group                 |
| `subgroup_id`     | TEXT | NOT NULL, FK -> user_group | Child group                  |

**Constraints:**

- PRIMARY KEY (`parent_group_id`, `subgroup_id`)

**Indexes:**

- `ix_user_group_subgroup_child` on `(subgroup_id)` -- find all parent groups of a subgroup.

## Repository Interface

### IUserGroupRepository

```
getAllGroups(tenantId: string) -> Result<UserGroup[]>
getGroupById(tenantId: string, groupId: string) -> Result<UserGroup | null>
createGroup(tenantId: string, name: string, description: string, memberIds: string[]) -> Result<UserGroup>
updateGroup(tenantId: string, groupId: string, name: string | null, description: string | null) -> Result<UserGroup>
deactivateGroup(tenantId: string, groupId: string) -> Result<void>
getMembers(tenantId: string, groupId: string) -> Result<string[]>
addMembers(tenantId: string, groupId: string, userIds: string[]) -> Result<void>
removeMembers(tenantId: string, groupId: string, userIds: string[]) -> Result<void>
isMember(tenantId: string, groupId: string, userId: string) -> Result<boolean>
addSubgroups(tenantId: string, groupId: string, subgroupIds: string[]) -> Result<void>
removeSubgroups(tenantId: string, groupId: string, subgroupIds: string[]) -> Result<void>
getSubgroups(tenantId: string, groupId: string) -> Result<string[]>
```

### Method Details

#### getAllGroups

Retrieve all groups (active and system) for a tenant. Includes both system groups and custom groups.

#### getGroupById

Retrieve a single group by tenant and group ID. Returns `null` if not found.

#### createGroup

Insert a new custom group. Generates a nanoid for the `id` field. Sets `created_at` and `updated_at`. Also inserts initial members into `user_group_member`. Validates that the group name is unique within the tenant.

#### updateGroup

Partial update of group name and/or description. Returns error if the group is a system group. Updates `updated_at`.

#### deactivateGroup

Set `is_active=0` on the group. Returns error if the group is a system group.

#### getMembers

Return the list of direct member user IDs for a group. For system groups, this computes membership from `user.role` rather than reading from `user_group_member`.

#### addMembers / removeMembers

Insert or delete rows in `user_group_member`. Returns error if the group is a system group.

#### isMember

Check whether a user is a member of a group. For custom groups, checks both direct membership in `user_group_member` and transitive membership via subgroups (recursively). For system groups, derives membership from `user.role`.

#### addSubgroups / removeSubgroups

Insert or delete rows in `user_group_subgroup`. Validates that adding a subgroup would not create a circular dependency (a group cannot be its own ancestor).

#### getSubgroups

Return the list of direct subgroup IDs for a group.

## Domain Functions

### createGroup

```
createGroup(repo: IUserGroupRepository, tenantId: string, actingUserId: string, name: string, description: string, memberIds: string[]) -> Result<UserGroup>
```

1. Validate that the acting user has permission to create groups (admin or has `can_manage_group` permission).
2. Validate the group name is not empty and does not start with "role:" (reserved for system groups).
3. Validate all member IDs refer to active users in the tenant.
4. Call `repo.createGroup` to persist.
5. Emit a `user_group` event with `op: "add"`.
6. Return the created group.

### updateGroup

```
updateGroup(repo: IUserGroupRepository, tenantId: string, actingUserId: string, groupId: string, name: string | null, description: string | null) -> Result<UserGroup>
```

1. Load the group. Return error if it is a system group.
2. Validate acting user has permission (admin or `can_manage_group`).
3. If name is provided, validate it is unique and does not start with "role:".
4. Call `repo.updateGroup` to persist.
5. Emit a `user_group` event with `op: "update"`.
6. Return the updated group.

### deactivateGroup

```
deactivateGroup(repo: IUserGroupRepository, tenantId: string, actingUserId: string, groupId: string) -> Result<void>
```

1. Load the group. Return error if it is a system group.
2. Validate acting user has permission (admin or `can_manage_group`).
3. Return error if the group is already deactivated.
4. Call `repo.deactivateGroup`.
5. Emit a `user_group` event with `op: "remove"`.

### updateMembers

```
updateMembers(repo: IUserGroupRepository, tenantId: string, actingUserId: string, groupId: string, addIds: string[], removeIds: string[]) -> Result<void>
```

1. Load the group. Return error if it is a system group.
2. Validate acting user has permission (admin or `can_add_members_group`).
3. Validate all user IDs in `addIds` refer to active users in the tenant.
4. Call `repo.addMembers` and `repo.removeMembers` as needed.
5. Emit `user_group` events with `op: "add_members"` and/or `op: "remove_members"`.

### updateSubgroups

```
updateSubgroups(repo: IUserGroupRepository, tenantId: string, actingUserId: string, groupId: string, addIds: string[], removeIds: string[]) -> Result<void>
```

1. Load the group. Return error if it is a system group.
2. Validate acting user has permission (admin or `can_manage_group`).
3. Validate all group IDs in `addIds` refer to active groups in the tenant.
4. Check for circular dependencies: for each subgroup being added, walk its subgroup tree to ensure the parent group is not reachable (would create a cycle).
5. Call `repo.addSubgroups` and `repo.removeSubgroups` as needed.
6. Emit `user_group` events with `op: "add_subgroups"` and/or `op: "remove_subgroups"`.

### checkMembership

```
checkMembership(repo: IUserGroupRepository, userRepo: IUserRepository, tenantId: string, groupId: string, userId: string) -> Result<boolean>
```

1. Load the group.
2. If system group, derive membership from the user's role:
   - `role:everyone` -- always true for active users.
   - `role:members` -- true if `user.role <= 400`.
   - `role:fullmembers` -- true if `user.role <= 400` and user has been a member long enough (based on org settings).
   - `role:moderators` -- true if `user.role <= 300`.
   - `role:administrators` -- true if `user.role <= 200`.
   - `role:owners` -- true if `user.role == 100`.
3. If custom group, check direct membership and transitive membership via subgroups.
4. Return the boolean result.

## Events

| Event Type    | Op                | Trigger                       | Payload                                                                                 |
| ------------- | ----------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `user_group`  | `add`             | Group created                 | `{ type: "user_group", op: "add", group: { id, name, description, members, ... } }`    |
| `user_group`  | `update`          | Group name/description changed| `{ type: "user_group", op: "update", group_id, data: { ...changed_fields } }`          |
| `user_group`  | `remove`          | Group deactivated             | `{ type: "user_group", op: "remove", group_id }`                                       |
| `user_group`  | `add_members`     | Members added to group        | `{ type: "user_group", op: "add_members", group_id, user_ids: [...] }`                 |
| `user_group`  | `remove_members`  | Members removed from group    | `{ type: "user_group", op: "remove_members", group_id, user_ids: [...] }`              |
| `user_group`  | `add_subgroups`   | Subgroups added to group      | `{ type: "user_group", op: "add_subgroups", group_id, direct_subgroup_ids: [...] }`    |
| `user_group`  | `remove_subgroups` | Subgroups removed from group | `{ type: "user_group", op: "remove_subgroups", group_id, direct_subgroup_ids: [...] }` |

All events are dispatched to the event queue module (see `02-event-queue.md`) for delivery to all active users in the tenant.
