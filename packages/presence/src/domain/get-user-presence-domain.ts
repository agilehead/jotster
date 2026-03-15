import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type {
  Result,
  AuthenticatedUser,
  User,
} from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserPresence } from "../repo/get-user-presence.ts";
import { buildLegacyUserPresenceMap } from "./presence-contract.ts";

interface UserPresenceResult {
  presence: Record<string, unknown>;
}

export const getUserPresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  targetUserIdOrEmail: string,
): Promise<Result<UserPresenceResult, string>> => {
  // Resolve user by ID or email
  const db = new JotsterDbContext(options);
  let targetUserId: long = 0 as long;
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const target0 = targetUserIdOrEmail;

    // Try by ID first (only if it looks numeric)
    const parsedNum = parseInt(target0, 10);
    let targetUser: User | undefined = undefined;

    if (!isNaN(parsedNum) && parsedNum > 0 && !target0.includes("@")) {
      const targetAsLong = Convert.ToInt64(parsedNum);
      targetUser = await db0.Users.Where((u) => u.TenantId === tenantId0)
        .Where((u) => u.Id === targetAsLong)
        .FirstOrDefaultAsync();
    }

    if (targetUser === undefined || targetUser === null) {
      // Try by email
      targetUser = await db0.Users.Where((u) => u.TenantId === tenantId0)
        .Where((u) => u.Email === target0)
        .FirstOrDefaultAsync();
    }

    if (targetUser === undefined || targetUser === null) {
      return err("User not found");
    }

    targetUserId = targetUser.Id;
  } finally {
    db.Dispose();
  }

  const allPresences = await getUserPresence(
    options,
    user.tenantId,
    targetUserId,
  );
  const presence = buildLegacyUserPresenceMap(allPresences);

  return ok({ presence });
};
