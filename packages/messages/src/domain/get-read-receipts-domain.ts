import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { getMessage } from "../repo/get-message.ts";
import { getReadReceipts } from "../repo/get-read-receipts.ts";

export const getReadReceiptsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: long,
): Promise<Result<{ userIds: long[] }, string>> => {
  // Verify message exists in the tenant
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  const rawUserIds = await getReadReceipts(options, user.tenantId, messageId);
  const db = new JotsterDbContext(options);
  try {
    const filteredUserIds: long[] = [];
    const tenantId0 = user.tenantId;
    const requesterId0 = user.userId;
    const senderId0 = message.SenderId;
    const enabled = 1 as int;

    for (let i = 0; i < rawUserIds.length; i++) {
      const receiptUserId = rawUserIds[i];
      if (receiptUserId === senderId0) {
        continue;
      }

      if (receiptUserId !== requesterId0) {
        const mutedByRequester = await db.MutedUsers.Where(
          (entry) => entry.TenantId === tenantId0,
        )
          .Where((entry) => entry.UserId === requesterId0)
          .Where((entry) => entry.MutedUserId === receiptUserId)
          .FirstOrDefaultAsync();
        if (mutedByRequester !== undefined && mutedByRequester !== null) {
          continue;
        }

        const mutedRequester = await db.MutedUsers.Where(
          (entry) => entry.TenantId === tenantId0,
        )
          .Where((entry) => entry.UserId === receiptUserId)
          .Where((entry) => entry.MutedUserId === requesterId0)
          .FirstOrDefaultAsync();
        if (mutedRequester !== undefined && mutedRequester !== null) {
          continue;
        }

        const settings = await db.UserSettings.Where(
          (entry) => entry.TenantId === tenantId0,
        )
          .Where((entry) => entry.UserId === receiptUserId)
          .FirstOrDefaultAsync();
        if (
          settings !== undefined &&
          settings !== null &&
          settings.SendReadReceipts !== enabled
        ) {
          continue;
        }
      }

      filteredUserIds.push(receiptUserId);
    }

    return ok({ userIds: filteredUserIds });
  } finally {
    db.Dispose();
  }
};
