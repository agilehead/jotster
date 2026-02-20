import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";
import { canUserAccessChannel } from "./can-user-access-channel.ts";
import { getChannelForAccessCheck } from "../repo/get-channel-for-access-check.ts";

export const canUserSendMessage = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  userRole: number,
  channelId: string | undefined
): Promise<Result<boolean, string>> => {
  // DM — check direct_message_permission_group
  if (channelId === undefined) {
    return await checkPermission(
      options,
      tenantId,
      userId,
      "direct_message_permission_group"
    );
  }

  // Channel message — check access first
  const accessResult = await canUserAccessChannel(
    options,
    tenantId,
    userId,
    userRole,
    channelId
  );

  if (!accessResult.success) {
    return accessResult;
  }

  if (!accessResult.data) {
    return ok(false);
  }

  // Check if channel is archived
  const channel = await getChannelForAccessCheck(options, tenantId, channelId);

  if (channel === undefined) {
    return ok(false);
  }

  if (channel.isArchived) {
    return ok(false);
  }

  return ok(true);
};
