import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserGroupDomain } from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";

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

  const body = req.body as Record<string, unknown>;
  const updates: {
    name?: string;
    description?: string;
    canAddMembersGroupId?: string;
    canJoinGroupId?: string;
    canLeaveGroupId?: string;
    canManageGroupId?: string;
    canMentionGroupId?: string;
  } = {};

  if (body["name"] !== undefined) updates.name = body["name"] as string;
  if (body["description"] !== undefined) updates.description = body["description"] as string;
  if (body["can_add_members_group"] !== undefined) updates.canAddMembersGroupId = body["can_add_members_group"] as string;
  if (body["can_join_group"] !== undefined) updates.canJoinGroupId = body["can_join_group"] as string;
  if (body["can_leave_group"] !== undefined) updates.canLeaveGroupId = body["can_leave_group"] as string;
  if (body["can_manage_group"] !== undefined) updates.canManageGroupId = body["can_manage_group"] as string;
  if (body["can_mention_group"] !== undefined) updates.canMentionGroupId = body["can_mention_group"] as string;

  const result = await updateUserGroupDomain(app.options, user, groupId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
