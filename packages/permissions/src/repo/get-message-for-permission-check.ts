import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const getMessageForPermissionCheck = async (
  options: DbContextOptions,
  tenantId: long,
  messageId: long,
): Promise<
  { senderId: long; channelId: long | undefined; createdAt: number } | undefined
> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;

    const msg = await db0.Messages.Where((m) => m.Id === messageId0)
      .Where((m) => m.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (msg === undefined) {
      return undefined;
    }

    return {
      senderId: msg.SenderId,
      channelId: msg.ChannelId,
      createdAt: Convert.ToDouble(msg.CreatedAt),
    };
  } finally {
    db.Dispose();
  }
};
