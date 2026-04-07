import type { JsValue, long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import {
  createUserGroupDomain,
  resolveGroupSettingToId,
  resolveGroupIdToSetting,
} from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getBodyObject,
  getOptionalStringArrayField,
  getOptionalStringField,
  toLong,
} from "../helpers/body.ts";

const parseIdArray = (values: string[] | undefined): long[] | undefined => {
  if (values === undefined) {
    return undefined;
  }
  const result: long[] = [];
  for (let i = 0; i < values.length; i++) {
    const parsed = parseId(values[i]);
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};

export const handleCreateUserGroup = async (
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
  const body = getBodyObject(req);

  const name = getOptionalStringField(body, "name");
  if (!name) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: name" });
    return;
  }

  const members = parseIdArray(getOptionalStringArrayField(body, "members"));

  const canAddMembersGroupValue = getOptionalStringField(
    body,
    "can_add_members_group",
  );
  const canJoinGroupValue = getOptionalStringField(body, "can_join_group");
  const canLeaveGroupValue = getOptionalStringField(body, "can_leave_group");
  const canManageGroupValue = getOptionalStringField(body, "can_manage_group");
  const canMentionGroupValue = getOptionalStringField(
    body,
    "can_mention_group",
  );
  const canRemoveMembersGroupValue = getOptionalStringField(
    body,
    "can_remove_members_group",
  );

  const result = await createUserGroupDomain(app.options, user, {
    name,
    description: getOptionalStringField(body, "description"),
    members,
    canAddMembersGroupId:
      canAddMembersGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canAddMembersGroupValue,
          ),
    canJoinGroupId:
      canJoinGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canJoinGroupValue,
          ),
    canLeaveGroupId:
      canLeaveGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canLeaveGroupValue,
          ),
    canManageGroupId:
      canManageGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canManageGroupValue,
          ),
    canMentionGroupId:
      canMentionGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canMentionGroupValue,
          ),
    canRemoveMembersGroupId:
      canRemoveMembersGroupValue === undefined
        ? undefined
        : await resolveGroupSettingToId(
            app.options,
            user.tenantId,
            canRemoveMembersGroupValue,
          ),
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const group = result.data;
  const resolveOutput = (
    id: long | undefined | null,
  ): Promise<string | null> => {
    return resolveGroupIdToSetting(app.options, user.tenantId, id);
  };

  const g: Record<string, JsValue> = {};
  g["id"] = group.Id;
  g["name"] = group.Name;
  g["description"] = group.Description;
  g["is_system_group"] = group.IsSystemGroup === 1;
  g["members"] = members ?? ([] as long[]);
  g["direct_subgroup_ids"] = [];
  g["creator_id"] = group.CreatorId ?? null;
  g["date_created"] = group.CreatedAt;
  g["can_add_members_group"] = await resolveOutput(group.CanAddMembersGroupId);
  g["can_join_group"] = await resolveOutput(group.CanJoinGroupId);
  g["can_leave_group"] = await resolveOutput(group.CanLeaveGroupId);
  g["can_manage_group"] = await resolveOutput(group.CanManageGroupId);
  g["can_mention_group"] = await resolveOutput(group.CanMentionGroupId);
  g["can_remove_members_group"] = await resolveOutput(
    group.CanRemoveMembersGroupId,
  );
  g["deactivated"] = group.IsActive !== 1;

  res.json({ result: "success", msg: "", group: g });
};
