import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

export const getReadReceipts = async (
  options: DbContextOptions,
  tenantId: string,
  messageId: string
): Promise<string[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;
    const readFlag = "read";

    // Verify the message belongs to this tenant
    const message = await db0.Messages
      .Where((m) => m.TenantId === tenantId0).Where((m) => m.Id === messageId0)
      .FirstOrDefaultAsync();

    if (message === undefined || message === null) {
      return [];
    }

    const flags = await db0.MessageFlags
      .Where((f) => f.MessageId === messageId0).Where((f) => f.Flag === readFlag)
      .ToListAsync();

    const userIds = new List<string>();
    for (let i = 0; i < flags.Count; i++) {
      const flag = flags[i];
      userIds.Add(flag.UserId);
    }
    return userIds.ToArray();
  } finally {
    db.Dispose();
  }
};
