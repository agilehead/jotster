import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { User, ok, err } from "@jotster/core/Jotster.Core.js";
import { hashPassword } from "@jotster/auth/Jotster.Auth.js";
import { getUserByEmail } from "../repo/get-user-by-email.ts";
import { createUser } from "../repo/create-user.ts";
import { createUserSetting } from "../repo/create-user-setting.ts";

export const createUserDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  input: { email: string; password: string; fullName: string }
): Promise<Result<User, string>> => {
  if (actingUser.role > 200) {
    return err("Insufficient permission");
  }

  const existing = await getUserByEmail(options, actingUser.tenantId, input.email);
  if (existing !== undefined && existing.IsActive === (1 as int)) {
    return err("User with this email already exists");
  }

  const passwordHash = hashPassword(input.password);

  const user = await createUser(options, {
    tenantId: actingUser.tenantId,
    email: input.email,
    fullName: input.fullName,
    passwordHash,
  });

  await createUserSetting(options, user.Id, actingUser.tenantId);

  return ok(user);
};
