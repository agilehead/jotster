import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { User } from "@jotster/core/Jotster.Core.js";
import { getAllUsers } from "../repo/get-all-users.ts";

export const getUsers = async (
  options: DbContextOptions,
  tenantId: long
): Promise<User[]> => {
  return await getAllUsers(options, tenantId);
};
