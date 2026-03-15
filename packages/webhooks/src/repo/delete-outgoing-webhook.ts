import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const deleteOutgoingWebhook = async (
  options: DbContextOptions,
  tenantId: long,
  botUserId: long,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const botUserId0 = botUserId;
    const webhook = await db0.OutgoingWebhooks.Where(
      (w) => w.TenantId === tenantId0,
    )
      .Where((w) => w.BotUserId === botUserId0)
      .FirstOrDefaultAsync();

    if (webhook === undefined || webhook === null) {
      return false;
    }

    db0.OutgoingWebhooks.Remove(webhook);
    await db0.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
