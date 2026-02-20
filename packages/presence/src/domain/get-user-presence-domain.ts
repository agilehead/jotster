import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserPresence } from "../repo/get-user-presence.ts";

const PRESENCE_STALE_THRESHOLD_MS = 300000 as long; // 5 minutes in ms

interface ClientPresence {
  status: string;
  timestamp: long;
}

interface UserPresenceResult {
  presence: Record<string, ClientPresence>;
}

export const getUserPresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  targetUserIdOrEmail: string
): Promise<Result<UserPresenceResult, string>> => {
  // Resolve user by ID or email
  const db = new JotsterDbContext(options);
  let targetUserId: string | undefined;
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const target0 = targetUserIdOrEmail;

    // Try by ID first
    let targetUser = await db0.Users
      .Where((u) => u.TenantId === tenantId0).Where((u) => u.Id === target0)
      .FirstOrDefaultAsync();

    if (targetUser === undefined || targetUser === null) {
      // Try by email
      targetUser = await db0.Users
        .Where((u) => u.TenantId === tenantId0).Where((u) => u.Email === target0)
        .FirstOrDefaultAsync();
    }

    if (targetUser === undefined || targetUser === null) {
      return err("User not found");
    }

    targetUserId = targetUser.Id;
  } finally {
    db.Dispose();
  }

  const allPresences = await getUserPresence(options, user.tenantId, targetUserId);
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  // Filter out stale entries and build presence map
  const presence: Record<string, ClientPresence> = {};
  let latestTimestamp = 0 as long;
  let aggregatedStatus = "offline";

  for (let i = 0; i < allPresences.Length; i++) {
    const p = allPresences[i];
    const age = (Number(now) - Number(p.Timestamp)) as long;
    if (Number(age) > Number(PRESENCE_STALE_THRESHOLD_MS)) {
      continue;
    }

    presence[p.ClientName] = {
      status: p.Status,
      timestamp: p.Timestamp,
    };

    if (Number(p.Timestamp) > Number(latestTimestamp)) {
      latestTimestamp = p.Timestamp;
      aggregatedStatus = p.Status;
    }
  }

  // Add aggregated entry
  if (aggregatedStatus !== "offline") {
    presence["aggregated"] = {
      status: aggregatedStatus,
      timestamp: latestTimestamp,
    };
  }

  return ok({ presence });
};
