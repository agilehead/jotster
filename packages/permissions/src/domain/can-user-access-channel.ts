import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { getChannelForAccessCheck } from "../repo/get-channel-for-access-check.ts";
import { isUserSubscribedToChannel } from "../repo/is-user-subscribed-to-channel.ts";

export const canUserAccessChannel = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  userRole: number,
  channelId: long
): Promise<Result<boolean, string>> => {
  const channel = await getChannelForAccessCheck(options, tenantId, channelId);

  if (channel === undefined) {
    return ok(false);
  }

  // Web-public channels are accessible to everyone
  if (channel.isWebPublic) {
    return ok(true);
  }

  // Public (non-private) channels
  if (!channel.isPrivate) {
    // Non-guest users (role <= 400) can access public channels
    if (userRole <= 400) {
      return ok(true);
    }
    // Guests (role > 400) need a subscription
    const subscribed = await isUserSubscribedToChannel(
      options,
      tenantId,
      userId,
      channelId
    );
    return ok(subscribed);
  }

  // Private channels require subscription
  const subscribed = await isUserSubscribedToChannel(
    options,
    tenantId,
    userId,
    channelId
  );
  return ok(subscribed);
};
