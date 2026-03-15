import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getPermissionSetting } from "../repo/get-permission-setting.ts";
import { isUserInGroup } from "../repo/is-user-in-group.ts";

export const checkPermission = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  settingName: string
): Promise<Result<boolean, string>> => {
  const settingResult = await getPermissionSetting(options, tenantId, settingName);

  if (!settingResult.success) {
    return err(settingResult.error);
  }

  const groupId = settingResult.data;
  const membershipResult = await isUserInGroup(options, tenantId, userId, groupId);

  return membershipResult;
};
