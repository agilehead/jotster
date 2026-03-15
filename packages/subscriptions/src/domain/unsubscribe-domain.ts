import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ok } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getSubscription } from "../repo/get-subscription.ts";
import { deleteSubscription } from "../repo/delete-subscription.ts";

export const unsubscribeDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelNames: string[],
): Promise<Result<{ removed: string[]; notRemoved: string[] }, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;

    const removed = new List<string>();
    const notRemoved = new List<string>();

    for (let i = 0; i < channelNames.length; i++) {
      const channelName0 = channelNames[i];

      // Look up channel by name
      const channel = await db0.Channels.Where((c) => c.TenantId === tenantId0)
        .Where((c) => c.Name === channelName0)
        .FirstOrDefaultAsync();

      if (channel === undefined || channel === null) {
        notRemoved.Add(channelName0);
        continue;
      }

      // Check if user is subscribed
      const sub = await getSubscription(
        options,
        user.tenantId,
        user.userId,
        channel.Id,
      );
      if (sub === undefined) {
        notRemoved.Add(channelName0);
        continue;
      }

      // Delete subscription (hard delete)
      await deleteSubscription(options, user.tenantId, user.userId, channel.Id);
      removed.Add(channelName0);
    }

    return ok({ removed: removed.ToArray(), notRemoved: notRemoved.ToArray() });
  } finally {
    db.Dispose();
  }
};
