import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createUserGroupDomain } from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";

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
  const body = req.body as Record<string, unknown>;

  const name = body["name"] as string | undefined;
  if (!name) {
    res.status(400).json({ result: "error", msg: "Missing required field: name" });
    return;
  }

  const result = await createUserGroupDomain(app.options, user, ({
    name,
    description: body["description"] as string | undefined,
    canAddMembersGroupId: body["can_add_members_group"] as string | undefined,
    canJoinGroupId: body["can_join_group"] as string | undefined,
    canLeaveGroupId: body["can_leave_group"] as string | undefined,
    canManageGroupId: body["can_manage_group"] as string | undefined,
    canMentionGroupId: body["can_mention_group"] as string | undefined,
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
  g["members"] = [];
  g["direct_subgroup_ids"] = [];
  g["can_add_members_group"] = group.CanAddMembersGroupId ?? null;
  g["can_join_group"] = group.CanJoinGroupId ?? null;
  g["can_leave_group"] = group.CanLeaveGroupId ?? null;
  g["can_manage_group"] = group.CanManageGroupId ?? null;
  g["can_mention_group"] = group.CanMentionGroupId ?? null;

  res.json({ result: "success", msg: "", group: g });
};
