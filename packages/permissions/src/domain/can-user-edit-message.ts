import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { getMessageForPermissionCheck } from "../repo/get-message-for-permission-check.ts";

export const canUserEditMessage = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  userRole: number,
  messageId: long,
  editContentLimitSeconds: number,
  allowMessageEditing: boolean,
  now: number
): Promise<Result<boolean, string>> => {
  // If message editing is globally disabled
  if (!allowMessageEditing) {
    // Admins can still edit
    if (userRole <= 200) {
      return ok(true);
    }
    return ok(false);
  }

  const message = await getMessageForPermissionCheck(options, tenantId, messageId);

  if (message === undefined) {
    return ok(false);
  }

  // Admins can always edit
  if (userRole <= 200) {
    return ok(true);
  }

  // Only the sender can edit their own message
  if (message.senderId !== userId) {
    return ok(false);
  }

  // If time limit is 0, no time restriction
  if (editContentLimitSeconds === 0) {
    return ok(true);
  }

  // Check time limit
  const elapsed = now - message.createdAt;
  const limitMs = editContentLimitSeconds * 1000;

  if (elapsed > limitMs) {
    return ok(false);
  }

  return ok(true);
};
