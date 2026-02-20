import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserGroupsDomain } from "@jotster/permissions/Jotster.Permissions.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetUserGroups = async (
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
  const groupsWithDetails = await getUserGroupsDomain(app.options, user);

  const user_groups = new List<Record<string, unknown>>();
  for (let i = 0; i < groupsWithDetails.length; i++) {
    const item = groupsWithDetails[i];
    const g: Record<string, unknown> = {};
    g["id"] = item.group.Id;
    g["name"] = item.group.Name;
    g["description"] = item.group.Description;
    g["is_system_group"] = item.group.IsSystemGroup === 1;
    g["members"] = item.members;
    g["direct_subgroup_ids"] = item.subgroups;
    g["can_add_members_group"] = item.group.CanAddMembersGroupId ?? null;
    g["can_join_group"] = item.group.CanJoinGroupId ?? null;
    g["can_leave_group"] = item.group.CanLeaveGroupId ?? null;
    g["can_manage_group"] = item.group.CanManageGroupId ?? null;
    g["can_mention_group"] = item.group.CanMentionGroupId ?? null;
    user_groups.Add(g);
  }

  res.json({ user_groups: user_groups.ToArray() });
};
