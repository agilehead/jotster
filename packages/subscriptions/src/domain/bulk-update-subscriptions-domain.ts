import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset, Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel, generateId, ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { createSubscription } from "../repo/create-subscription.ts";
import { getSubscription } from "../repo/get-subscription.ts";
import { deleteSubscription } from "../repo/delete-subscription.ts";
import { countUserSubscriptions } from "../repo/count-user-subscriptions.ts";

const SUBSCRIPTION_COLORS = [
  "#76ce90", "#fae589", "#a6c7e5", "#e79ab5", "#bfd56e", "#f4ae55",
  "#b0a5fd", "#addfe5", "#f5ce6e", "#c2726a", "#94c849", "#bd86e5",
  "#ee7e4a", "#a6dcbf", "#95a5fd", "#53a063", "#9987e1", "#e4523d",
  "#c2c2c2", "#4f8de4", "#c6a8ad", "#e7cc4e", "#c8bebf", "#a47462",
];

export const bulkUpdateSubscriptionsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  add?: { name: string; description?: string }[],
  remove?: string[]
): Promise<Result<{ subscribed: Record<string, string[]>; alreadySubscribed: Record<string, string[]>; removed: string[]; notRemoved: string[] }, string>> => {
  if ((add === undefined || add.length === 0) && (remove === undefined || remove.length === 0)) {
    return err("Must provide at least one of add or remove");
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;

    const subscribed: Record<string, string[]> = {};
    const alreadySubscribed: Record<string, string[]> = {};
    const removed = new List<string>();
    const notRemoved = new List<string>();

    // Process additions
    if (add !== undefined) {
      for (let i = 0; i < add.length; i++) {
        const item = add[i];
        const channelName0 = item.name;

        // Look up channel by name
        let channel = await db0.Channels
          .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === channelName0)
          .FirstOrDefaultAsync();

        // Auto-create if not exists (public by default)
        if (channel === undefined || channel === null) {
          const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
          channel = new Channel();
          channel.Id = generateId();
          channel.TenantId = user.tenantId;
          channel.Name = item.name;
          channel.Description = item.description ?? "";
          channel.RenderedDescription = item.description ?? "";
          channel.IsPrivate = 0 as int;
          channel.IsWebPublic = 0 as int;
          channel.HistoryPublicToSubscribers = 1 as int;
          channel.CreatorId = user.userId;
          channel.IsArchived = 0 as int;
          channel.CreatedAt = now;
          channel.UpdatedAt = now;
          db0.Channels.Add(channel);
          await db0.SaveChangesAsync();
        }

        // Check if already subscribed
        const existingSub = await getSubscription(options, user.tenantId, user.userId, channel.Id);

        if (existingSub !== undefined) {
          if (alreadySubscribed[user.email] === undefined) {
            alreadySubscribed[user.email] = [];
          }
          const alreadyList = new List<string>();
          for (let ai = 0; ai < alreadySubscribed[user.email].length; ai++) {
            alreadyList.Add(alreadySubscribed[user.email][ai]);
          }
          alreadyList.Add(item.name);
          alreadySubscribed[user.email] = alreadyList.ToArray();
        } else {
          // Assign color from palette using count % 24
          const count = await countUserSubscriptions(options, user.tenantId, user.userId);
          const countInt = Convert.ToInt32(count);
          const colorIndex = countInt % (24 as int);
          const color = SUBSCRIPTION_COLORS[colorIndex];

          await createSubscription(options, {
            tenantId: user.tenantId,
            userId: user.userId,
            channelId: channel.Id,
            color,
          });

          if (subscribed[user.email] === undefined) {
            subscribed[user.email] = [];
          }
          const subList = new List<string>();
          for (let si = 0; si < subscribed[user.email].length; si++) {
            subList.Add(subscribed[user.email][si]);
          }
          subList.Add(item.name);
          subscribed[user.email] = subList.ToArray();
        }
      }
    }

    // Process removals
    if (remove !== undefined) {
      for (let i = 0; i < remove.length; i++) {
        const channelName0 = remove[i];

        const channel = await db0.Channels
          .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === channelName0)
          .FirstOrDefaultAsync();

        if (channel === undefined || channel === null) {
          notRemoved.Add(channelName0);
          continue;
        }

        const existingSub = await getSubscription(options, user.tenantId, user.userId, channel.Id);
        if (existingSub === undefined) {
          notRemoved.Add(channelName0);
          continue;
        }

        await deleteSubscription(options, user.tenantId, user.userId, channel.Id);
        removed.Add(channelName0);
      }
    }

    return ok({ subscribed, alreadySubscribed, removed: removed.ToArray(), notRemoved: notRemoved.ToArray() });
  } finally {
    db.Dispose();
  }
};
