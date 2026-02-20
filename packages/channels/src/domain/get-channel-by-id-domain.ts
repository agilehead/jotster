import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, Channel, ok, err } from "@jotster/core/Jotster.Core.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";

export const getChannelByIdDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: string
): Promise<Result<Channel, string>> => {
  const channel = await getChannelById(options, channelId);
  if (channel === undefined) {
    return err("Channel not found");
  }

  const one = 1 as int;
  if (channel.IsPrivate === one) {
    // Admin can see all private channels
    if (user.role <= 200) {
      return ok(channel);
    }

    // Non-admin: check subscription
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;
      const userId0 = user.userId;
      const channelId0 = channelId;
      const sub = await db0.Subscriptions
        .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0).Where((s) => s.ChannelId === channelId0)
        .FirstOrDefaultAsync();
      if (sub === undefined || sub === null) {
        return err("Channel not found");
      }
    } finally {
      db.Dispose();
    }
  }

  return ok(channel);
};
