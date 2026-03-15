import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, Channel } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getChannels } from "../repo/get-channels.ts";

export const getChannelsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  includeArchived: boolean
): Promise<Channel[]> => {
  const channels = await getChannels(options, user.tenantId, includeArchived);

  // Admins (role <= 200) see all channels
  if (user.role <= 200) {
    return channels;
  }

  // Non-admin users: filter out private channels they are not subscribed to
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const userId0 = user.userId;
    const subs = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .ToListAsync();

    const subscribedChannelIds = new List<long>();
    for (let i = 0; i < subs.Count; i++) {
      const sub = subs[i];
      subscribedChannelIds.Add(sub.ChannelId);
    }

    const zero = 0 as int;
    const filtered = new List<Channel>();
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      let found = false;
      for (let j = 0; j < subscribedChannelIds.Count; j++) {
        if (subscribedChannelIds[j] === ch.Id) {
          found = true;
          break;
        }
      }
      if (ch.IsPrivate === zero || found) {
        filtered.Add(ch);
      }
    }
    return filtered.ToArray();
  } finally {
    db.Dispose();
  }
};
