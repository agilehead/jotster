import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";
import { getMessageForPermissionCheck } from "../repo/get-message-for-permission-check.ts";

export const canUserDeleteMessage = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  messageId: string,
  deleteContentLimitSeconds: number,
  now: number
): Promise<Result<boolean, string>> => {
  // Check can_delete_any_message first
  const deleteAnyResult = await checkPermission(
    options,
    tenantId,
    userId,
    "can_delete_any_message"
  );

  if (!deleteAnyResult.success) {
    return deleteAnyResult;
  }

  if (deleteAnyResult.data) {
    return ok(true);
  }

  // Fetch the message
  const message = await getMessageForPermissionCheck(options, tenantId, messageId);

  if (message === undefined) {
    return ok(false);
  }

  // Only the sender can delete their own message
  if (message.senderId !== userId) {
    return ok(false);
  }

  // Check can_delete_own_message
  const deleteOwnResult = await checkPermission(
    options,
    tenantId,
    userId,
    "can_delete_own_message"
  );

  if (!deleteOwnResult.success) {
    return deleteOwnResult;
  }

  if (!deleteOwnResult.data) {
    return ok(false);
  }

  // If time limit is 0, no time restriction
  if (deleteContentLimitSeconds === 0) {
    return ok(true);
  }

  // Check time limit
  const elapsed = now - message.createdAt;
  const limitMs = deleteContentLimitSeconds * 1000;

  if (elapsed > limitMs) {
    return ok(false);
  }

  return ok(true);
};
