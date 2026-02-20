import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const getMessageForPermissionCheck = async (
  options: DbContextOptions,
  tenantId: string,
  messageId: string
): Promise<
  { senderId: string; channelId: string | undefined; createdAt: number } | undefined
> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const messageId0 = messageId;

    const msg = await db0.Messages
      .Where((m) => m.Id === messageId0).Where((m) => m.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (msg === undefined) {
      return undefined;
    }

    return {
      senderId: msg.SenderId,
      channelId: msg.ChannelId,
      createdAt: Number(msg.CreatedAt),
    };
  } finally {
    db.Dispose();
  }
};
