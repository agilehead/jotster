import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Presence } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updatePresence } from "../repo/update-presence.ts";
import { getRealmPresence } from "../repo/get-realm-presence.ts";
import {
  buildModernPresenceMap,
  filterPresenceEntries,
  getPresenceLastUpdateId,
} from "./presence-contract.ts";

interface UpdatePresenceParams {
  status: string;
  client?: string;
  pingOnly?: boolean;
  slimPresence?: boolean;
  historyLimitDays?: int;
  lastUpdateId?: long;
}

interface PresenceResult {
  presences?: Record<string, unknown>;
  serverTimestamp?: long;
  presenceLastUpdateId: long;
}

export const updatePresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: UpdatePresenceParams
): Promise<Result<PresenceResult, string>> => {
  if (params.status !== "active" && params.status !== "idle") {
    return err("Invalid status: must be 'active' or 'idle'");
  }

  const clientName = params.client ?? "website";

  await updatePresence(
    options,
    user.tenantId,
    user.userId,
    clientName,
    params.status,
    params.pingOnly
  );

  // Dispatch presence event to tenant
  dispatchEventToTenant(user.tenantId, {
    type: "presence",
    data: {
      user_id: user.userId,
      email: user.email,
      presence: {
        website: {
          status: params.status,
          timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long,
        },
        aggregated: {
          status: params.status,
          timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long,
        },
      },
      server_timestamp: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long,
    },
  });

  const allPresences = await getRealmPresence(options, user.tenantId);
  const presenceLastUpdateId = getPresenceLastUpdateId(allPresences, params.lastUpdateId);
  if (params.pingOnly === true) {
    return ok({ presenceLastUpdateId });
  }

  const filteredPresences = filterPresenceEntries(allPresences, params.historyLimitDays, params.lastUpdateId);
  const serverTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
  const shouldUseModernFormat = params.lastUpdateId !== undefined || params.slimPresence === true;

  if (shouldUseModernFormat) {
    return ok({
      presences: buildModernPresenceMap(filteredPresences),
      serverTimestamp,
      presenceLastUpdateId,
    });
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const users = await db0.Users
      .Where((u) => u.TenantId === tenantId0)
      .ToListAsync();
    const presences: Record<string, unknown> = {};

    for (let i = 0; i < users.Count; i++) {
      const currentUser = users[i];
      let latestEntry: Presence | undefined;

      for (let j = 0; j < filteredPresences.length; j++) {
        const entry = filteredPresences[j];
        if (entry.UserId !== currentUser.Id) {
          continue;
        }

        if (latestEntry === undefined || entry.Timestamp > latestEntry.Timestamp) {
          latestEntry = entry;
        }
      }

      if (latestEntry === undefined) {
        continue;
      }

      const legacyPresence: Record<string, unknown> = {
        website: {
          client: "website",
          pushable: false,
          status: latestEntry.Status,
          timestamp: latestEntry.Timestamp,
        },
        aggregated: {
          client: "website",
          pushable: false,
          status: latestEntry.Status,
          timestamp: latestEntry.Timestamp,
        },
      };
      presences[currentUser.Email] = legacyPresence as unknown;
    }

    return ok({
      presences,
      serverTimestamp,
      presenceLastUpdateId,
    });
  } finally {
    db.Dispose();
  }
};
