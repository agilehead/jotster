import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserGroupDomain } from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalBooleanField, getOptionalStringField, hasField } from "../helpers/body.ts";

export const handleUpdateUserGroup = async (
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
  const groupId = req.params["group_id"] as string;

  const body = getBodyObject(req);
  const updates: {
    name?: string;
    description?: string;
    canAddMembersGroupId?: string;
    canJoinGroupId?: string;
    canLeaveGroupId?: string;
    canManageGroupId?: string;
    canMentionGroupId?: string;
    canRemoveMembersGroupId?: string;
    deactivated?: boolean;
  } = {};

  const name = getOptionalStringField(body, "name");
  if (name !== undefined) updates.name = name;
  const description = getOptionalStringField(body, "description");
  if (description !== undefined) updates.description = description;
  if (hasField(body, "can_add_members_group")) updates.canAddMembersGroupId = getOptionalStringField(body, "can_add_members_group");
  if (hasField(body, "can_join_group")) updates.canJoinGroupId = getOptionalStringField(body, "can_join_group");
  if (hasField(body, "can_leave_group")) updates.canLeaveGroupId = getOptionalStringField(body, "can_leave_group");
  if (hasField(body, "can_manage_group")) updates.canManageGroupId = getOptionalStringField(body, "can_manage_group");
  if (hasField(body, "can_mention_group")) updates.canMentionGroupId = getOptionalStringField(body, "can_mention_group");
  if (hasField(body, "can_remove_members_group")) {
    updates.canRemoveMembersGroupId = getOptionalStringField(body, "can_remove_members_group");
  }
  if (hasField(body, "deactivated")) {
    updates.deactivated = getOptionalBooleanField(body, "deactivated");
  }

  const result = await updateUserGroupDomain(app.options, user, groupId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
