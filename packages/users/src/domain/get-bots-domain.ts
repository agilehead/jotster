import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { User } from "@jotster/core/Jotster.Core.js";
import { getBotsForOwner } from "../repo/get-bots-for-owner.ts";

export const getBotsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<User[]> => {
  return await getBotsForOwner(options, user.tenantId, user.userId);
};
