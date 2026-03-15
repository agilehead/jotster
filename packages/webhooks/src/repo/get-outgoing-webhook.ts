import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, OutgoingWebhook } from "@jotster/core/Jotster.Core.js";

export const getOutgoingWebhook = async (
  options: DbContextOptions,
  tenantId: long,
  botUserId: long
): Promise<OutgoingWebhook | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const botUserId0 = botUserId;
    const result = await db0.OutgoingWebhooks
      .Where((w) => w.TenantId === tenantId0).Where((w) => w.BotUserId === botUserId0)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
