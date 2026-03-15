import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { User, ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";

export const getUserByIdDomain = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<Result<User, string>> => {
  const user = await getUser(options, userId);
  if (user === undefined) {
    return err("User not found");
  }
  if (user.TenantId !== tenantId) {
    return err("User not found");
  }
  return ok(user);
};
