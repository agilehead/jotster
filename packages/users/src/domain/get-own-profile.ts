import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { User, ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";

export const getOwnProfile = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Result<User, string>> => {
  const profile = await getUser(options, user.userId);
  if (profile === undefined) {
    return err("User not found");
  }
  return ok(profile);
};
