import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { User, ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";
import { updateUser } from "../repo/update-user.ts";

export const updateUserDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  targetUserId: string,
  updates: { fullName?: string; role?: int }
): Promise<Result<User, string>> => {
  const isSelf = actingUser.userId === targetUserId;
  const isAdmin = actingUser.role <= 200;

  // Non-admins can only update themselves
  if (!isSelf && !isAdmin) {
    return err("Insufficient permission");
  }

  // Non-admins can only update fullName
  if (!isAdmin && updates.role !== undefined) {
    return err("Insufficient permission");
  }

  // Check target user exists
  const targetUser = await getUser(options, targetUserId);
  if (targetUser === undefined) {
    return err("User not found");
  }

  if (targetUser.TenantId !== actingUser.tenantId) {
    return err("User not found");
  }

  // Cannot change an owner's role unless you are the owner themselves
  if (
    updates.role !== undefined &&
    targetUser.Role === (100 as int) &&
    !isSelf
  ) {
    return err("Cannot change owner role");
  }

  const updated = await updateUser(options, actingUser.tenantId, targetUserId, {
    fullName: updates.fullName,
    role: updates.role,
  });

  if (updated === undefined) {
    return err("User not found");
  }

  return ok(updated);
};
