import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createUserGroupDomain } from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";

export const handleCreateUserGroup = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const body = getBodyObject(req);

  const name = getOptionalStringField(body, "name");
  if (!name) {
    res.status(400).json({ result: "error", msg: "Missing required field: name" });
    return;
  }

  const members = getOptionalStringArrayField(body, "members");
  const result = await createUserGroupDomain(app.options, user, ({
    name,
    description: getOptionalStringField(body, "description"),
    members,
    canAddMembersGroupId: getOptionalStringField(body, "can_add_members_group"),
    canJoinGroupId: getOptionalStringField(body, "can_join_group"),
    canLeaveGroupId: getOptionalStringField(body, "can_leave_group"),
    canManageGroupId: getOptionalStringField(body, "can_manage_group"),
    canMentionGroupId: getOptionalStringField(body, "can_mention_group"),
    canRemoveMembersGroupId: getOptionalStringField(body, "can_remove_members_group"),
  }));

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const group = result.data;
  const g: Record<string, unknown> = {};
  g["id"] = group.Id;
  g["name"] = group.Name;
  g["description"] = group.Description;
  g["is_system_group"] = group.IsSystemGroup === 1;
  g["members"] = members ?? ([] as string[]);
  g["direct_subgroup_ids"] = [];
  g["creator_id"] = group.CreatorId ?? null;
  g["date_created"] = group.CreatedAt;
  g["can_add_members_group"] = group.CanAddMembersGroupId ?? null;
  g["can_join_group"] = group.CanJoinGroupId ?? null;
  g["can_leave_group"] = group.CanLeaveGroupId ?? null;
  g["can_manage_group"] = group.CanManageGroupId ?? null;
  g["can_mention_group"] = group.CanMentionGroupId ?? null;
  g["can_remove_members_group"] = group.CanRemoveMembersGroupId ?? null;
  g["deactivated"] = group.IsActive !== 1;

  res.json({ result: "success", msg: "", group: g });
};
