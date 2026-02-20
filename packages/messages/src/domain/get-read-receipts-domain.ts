import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getMessage } from "../repo/get-message.ts";
import { getReadReceipts } from "../repo/get-read-receipts.ts";

export const getReadReceiptsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string
): Promise<Result<{ userIds: string[] }, string>> => {
  // Verify message exists in the tenant
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  const userIds = await getReadReceipts(options, user.tenantId, messageId);
  return ok({ userIds });
};
