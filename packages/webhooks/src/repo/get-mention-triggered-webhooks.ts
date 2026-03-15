import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  OutgoingWebhook,
} from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getMentionTriggeredWebhooks = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<OutgoingWebhook[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const triggerType0 = "mention";
    const result = await db0.OutgoingWebhooks.Where(
      (w) => w.TenantId === tenantId0,
    )
      .Where((w) => w.TriggerType === triggerType0)
      .ToListAsync();

    const webhooks = new List<OutgoingWebhook>();
    for (let i = 0; i < result.Count; i++) {
      const webhook = result[i];
      webhooks.Add(webhook);
    }
    return webhooks.ToArray();
  } finally {
    db.Dispose();
  }
};
