import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, OutgoingWebhook } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getOutgoingWebhooksForChannel = async (
  options: DbContextOptions,
  tenantId: string,
  channelId: string
): Promise<OutgoingWebhook[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const triggerType0 = "channel";
    const allChannelWebhooks = await db0.OutgoingWebhooks
      .Where((w) => w.TenantId === tenantId0).Where((w) => w.TriggerType === triggerType0)
      .ToArrayAsync();

    // Filter in JS by parsing ChannelIdsJson
    const matched = new List<OutgoingWebhook>();
    for (let i = 0; i < allChannelWebhooks.Length; i++) {
      const webhook = allChannelWebhooks[i];
      if (webhook.ChannelIdsJson !== undefined && webhook.ChannelIdsJson !== null) {
        try {
          const channelIds = JSON.parse(webhook.ChannelIdsJson) as string[];
          for (let j = 0; j < channelIds.length; j++) {
            if (channelIds[j] === channelId) {
              matched.Add(webhook);
              break;
            }
          }
        } catch (_e) {
          // Invalid JSON, skip this webhook
        }
      }
    }

    return matched.ToArray();
  } finally {
    db.Dispose();
  }
};
