import type { long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserGroupsDomain, resolveGroupIdToSetting } from "@jotster/permissions/Jotster.Permissions.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalBooleanField } from "../helpers/body.ts";

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
  const body = getBodyObject(req);
  const query = req.query as Record<string, unknown>;
  const includeDeactivatedGroups =
    getOptionalBooleanField(query, "include_deactivated_groups")
    ?? getOptionalBooleanField(body, "include_deactivated_groups")
    ?? false;

  const groupsWithDetails = await getUserGroupsDomain(app.options, user, includeDeactivatedGroups);

  const resolveOutput = async (id: unknown): Promise<string | null> => {
    if (id === undefined || id === null) {
      return null;
    }
    return await resolveGroupIdToSetting(app.options, user.tenantId, id as long);
  };

  const user_groups = new List<Record<string, unknown>>();
  for (let i = 0; i < groupsWithDetails.length; i++) {
    const item = groupsWithDetails[i];
    const g: Record<string, unknown> = {};
    g["id"] = item.group.Id;
    g["name"] = item.group.Name;
    g["description"] = item.group.Description;
    g["is_system_group"] = item.group.IsSystemGroup === 1;
    g["creator_id"] = item.group.CreatorId ?? null;
    g["date_created"] = item.group.CreatedAt;
    g["members"] = item.members;
    g["direct_subgroup_ids"] = item.subgroups;
    g["can_add_members_group"] = await resolveOutput(item.group.CanAddMembersGroupId);
    g["can_join_group"] = await resolveOutput(item.group.CanJoinGroupId);
    g["can_leave_group"] = await resolveOutput(item.group.CanLeaveGroupId);
    g["can_manage_group"] = await resolveOutput(item.group.CanManageGroupId);
    g["can_mention_group"] = await resolveOutput(item.group.CanMentionGroupId);
    g["can_remove_members_group"] = await resolveOutput(item.group.CanRemoveMembersGroupId);
    g["deactivated"] = item.group.IsActive !== 1;
    user_groups.Add(g);
  }

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["user_groups"] = user_groups.ToArray();
  res.json(payload);
};
