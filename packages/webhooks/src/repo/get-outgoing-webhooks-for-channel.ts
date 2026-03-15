import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  OutgoingWebhook,
} from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";

export const getOutgoingWebhooksForChannel = async (
  options: DbContextOptions,
  tenantId: long,
  channelId: long,
): Promise<OutgoingWebhook[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const triggerType0 = "channel";
    const allChannelWebhooks = await db0.OutgoingWebhooks.Where(
      (w) => w.TenantId === tenantId0,
    )
      .Where((w) => w.TriggerType === triggerType0)
      .ToListAsync();

    // Filter in JS by parsing ChannelIdsJson
    const channelIdStr = Convert.ToString(channelId);
    const matched = new List<OutgoingWebhook>();
    for (let i = 0; i < allChannelWebhooks.Count; i++) {
      const webhook = allChannelWebhooks[i];
      if (
        webhook.ChannelIdsJson !== undefined &&
        webhook.ChannelIdsJson !== null
      ) {
        try {
          const channelIds = JsonSerializer.Deserialize<string[]>(
            webhook.ChannelIdsJson,
          );
          if (channelIds === undefined) {
            continue;
          }
          for (let j = 0; j < channelIds.length; j++) {
            const currentChannelId = channelIds[j];
            if (currentChannelId === channelIdStr) {
              matched.Add(webhook);
              break;
            }
          }
        } catch (_e) {}
      }
    }

    return matched.ToArray();
  } finally {
    db.Dispose();
  }
};
