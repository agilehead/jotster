import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset, Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Channel, ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { createSubscription } from "../repo/create-subscription.ts";
import { getSubscription } from "../repo/get-subscription.ts";
import { countUserSubscriptions } from "../repo/count-user-subscriptions.ts";

const SUBSCRIPTION_COLORS = [
  "#76ce90", "#fae589", "#a6c7e5", "#e79ab5", "#bfd56e", "#f4ae55",
  "#b0a5fd", "#addfe5", "#f5ce6e", "#c2726a", "#94c849", "#bd86e5",
  "#ee7e4a", "#a6dcbf", "#95a5fd", "#53a063", "#9987e1", "#e4523d",
  "#c2c2c2", "#4f8de4", "#c6a8ad", "#e7cc4e", "#c8bebf", "#a47462",
];

interface CreateParams {
  description?: string;
  isPrivate?: int;
  isWebPublic?: int;
  historyPublicToSubscribers?: int;
  messageRetentionDays?: int;
}

export const subscribeDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelName: string,
  principals?: string[],
  createParams?: CreateParams
): Promise<Result<{ subscribed: Record<string, string[]>; alreadySubscribed: Record<string, string[]> }, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const channelName0 = channelName;

    // Look up channel by name
    let channel = await db0.Channels
      .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === channelName0)
      .FirstOrDefaultAsync();

    if ((channel === undefined || channel === null) && createParams !== undefined) {
      // Create the channel
      const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
      channel = new Channel();
      channel.TenantId = user.tenantId;
      channel.Name = channelName;
      channel.Description = createParams.description ?? "";
      channel.RenderedDescription = createParams.description ?? "";
      channel.IsPrivate = (createParams.isPrivate ?? 0) as int;
      channel.IsWebPublic = (createParams.isWebPublic ?? 0) as int;
      channel.HistoryPublicToSubscribers = (createParams.historyPublicToSubscribers ?? 1) as int;
      channel.MessageRetentionDays = createParams.messageRetentionDays;
      channel.CreatorId = user.userId;
      channel.IsArchived = 0 as int;
      channel.CreatedAt = now;
      channel.UpdatedAt = now;
      db0.Channels.Add(channel);
      await db0.SaveChangesAsync();
    }

    if (channel === undefined || channel === null) {
      return err("Channel not found");
    }

    if (channel.IsArchived === 1) {
      return err("Channel is archived");
    }

    // Determine target users
    const targetUsers = new List<{ id: long; email: string }>();

    if (principals !== undefined && principals.length > 0) {
      // For private channels: only admin or channel creator can subscribe others
      if (channel.IsPrivate === 1 && user.role > 200 && channel.CreatorId !== user.userId) {
        return err("Only admins or channel creator can subscribe others to private channels");
      }

      for (let i = 0; i < principals.length; i++) {
        const principal0 = principals[i];
        // Look up by email
        const targetUser = await db0.Users
          .Where((u) => u.TenantId === tenantId0).Where((u) => u.Email === principal0)
          .FirstOrDefaultAsync();
        if (targetUser !== undefined && targetUser !== null) {
          targetUsers.Add({ id: targetUser.Id, email: targetUser.Email });
        }
      }
    } else {
      targetUsers.Add({ id: user.userId, email: user.email });
    }

    const subscribed: Record<string, string[]> = {};
    const alreadySubscribed: Record<string, string[]> = {};

    for (let i = 0; i < targetUsers.Count; i++) {
      const target = targetUsers[i];
      const existingSub = await getSubscription(options, user.tenantId, target.id, channel.Id);

      if (existingSub !== undefined) {
        if (alreadySubscribed[target.email] === undefined) {
          alreadySubscribed[target.email] = [];
        }
        const alreadyList = new List<string>();
        for (let ai = 0; ai < alreadySubscribed[target.email].length; ai++) {
          alreadyList.Add(alreadySubscribed[target.email][ai]);
        }
        alreadyList.Add(channelName);
        alreadySubscribed[target.email] = alreadyList.ToArray();
      } else {
        // Assign color from palette using count % 24
        const count = await countUserSubscriptions(options, user.tenantId, target.id);
        const countInt = Convert.ToInt32(count);
        const colorIndex = countInt % (24 as int);
        const color = SUBSCRIPTION_COLORS[colorIndex];

        await createSubscription(options, {
          tenantId: user.tenantId,
          userId: target.id,
          channelId: channel.Id,
          color,
        });

        if (subscribed[target.email] === undefined) {
          subscribed[target.email] = [];
        }
        const subList = new List<string>();
        for (let si = 0; si < subscribed[target.email].length; si++) {
          subList.Add(subscribed[target.email][si]);
        }
        subList.Add(channelName);
        subscribed[target.email] = subList.ToArray();
      }
    }

    return ok({ subscribed, alreadySubscribed });
  } finally {
    db.Dispose();
  }
};
