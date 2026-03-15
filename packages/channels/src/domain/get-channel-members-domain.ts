import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";
import { getChannelSubscribers } from "../repo/get-channel-subscribers.ts";

export const getChannelMembersDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: long,
): Promise<Result<long[], string>> => {
  const channel = await getChannelById(options, channelId);
  if (channel === undefined) {
    return err("Channel not found");
  }

  const one = 1 as int;
  if (channel.IsPrivate === one) {
    if (user.role > 200) {
      const db = new JotsterDbContext(options);
      try {
        const db0 = db;
        const tenantId0 = user.tenantId;
        const userId0 = user.userId;
        const channelId0 = channelId;
        const sub = await db0.Subscriptions.Where(
          (s) => s.TenantId === tenantId0,
        )
          .Where((s) => s.UserId === userId0)
          .Where((s) => s.ChannelId === channelId0)
          .FirstOrDefaultAsync();
        if (sub === undefined || sub === null) {
          return err("Channel not found");
        }
      } finally {
        db.Dispose();
      }
    }
  }

  const members = await getChannelSubscribers(
    options,
    user.tenantId,
    channelId,
  );
  return ok(members);
};
