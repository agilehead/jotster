import type { long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import {
  updateUserGroupDomain,
  resolveGroupSettingToId,
} from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getBodyObject,
  getOptionalBooleanField,
  getOptionalStringField,
  hasField,
  toLong,
} from "../helpers/body.ts";

export const handleUpdateUserGroup = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const groupId = parseId(req.param("group_id") ?? "");
  if (groupId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid group_id" });
    return;
  }

  const body = getBodyObject(req);
  const updates: {
    name?: string;
    description?: string;
    canAddMembersGroupId?: long;
    canJoinGroupId?: long;
    canLeaveGroupId?: long;
    canManageGroupId?: long;
    canMentionGroupId?: long;
    canRemoveMembersGroupId?: long;
    deactivated?: boolean;
  } = {};

  const name = getOptionalStringField(body, "name");
  if (name !== undefined) updates.name = name;
  const description = getOptionalStringField(body, "description");
  if (description !== undefined) updates.description = description;
  if (hasField(body, "can_add_members_group")) {
    const value = getOptionalStringField(body, "can_add_members_group");
    updates.canAddMembersGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "can_join_group")) {
    const value = getOptionalStringField(body, "can_join_group");
    updates.canJoinGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "can_leave_group")) {
    const value = getOptionalStringField(body, "can_leave_group");
    updates.canLeaveGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "can_manage_group")) {
    const value = getOptionalStringField(body, "can_manage_group");
    updates.canManageGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "can_mention_group")) {
    const value = getOptionalStringField(body, "can_mention_group");
    updates.canMentionGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "can_remove_members_group")) {
    const value = getOptionalStringField(body, "can_remove_members_group");
    updates.canRemoveMembersGroupId =
      value === undefined
        ? undefined
        : await resolveGroupSettingToId(app.options, user.tenantId, value);
  }
  if (hasField(body, "deactivated")) {
    updates.deactivated = getOptionalBooleanField(body, "deactivated");
  }

  const result = await updateUserGroupDomain(
    app.options,
    user,
    toLong(groupId),
    updates,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
