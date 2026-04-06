import type { int, JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Presence } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import { getRealmPresence } from "../repo/get-realm-presence.ts";
import {
  buildModernPresenceMap,
  filterPresenceEntries,
} from "./presence-contract.ts";

interface RealmPresenceResult {
  presences: Record<string, JsValue>;
  serverTimestamp: long;
}

export const getRealmPresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  slimPresence?: boolean,
  historyLimitDays?: int,
): Promise<Result<RealmPresenceResult, string>> => {
  const allPresences = await getRealmPresence(options, user.tenantId);
  const filteredPresences = filterPresenceEntries(
    allPresences,
    historyLimitDays,
  );
  const serverTimestamp =
    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  if (slimPresence === true) {
    return ok({
      presences: buildModernPresenceMap(filteredPresences),
      serverTimestamp,
    });
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const users = await db0.Users.Where(
      (u) => u.TenantId === tenantId0,
    ).ToListAsync();
    const presences: Record<string, JsValue> = {};

    for (let i = 0; i < users.Count; i++) {
      const currentUser = users[i];
      let latestEntry: Presence | undefined;

      for (let j = 0; j < filteredPresences.length; j++) {
        const entry = filteredPresences[j];
        if (entry.UserId !== currentUser.Id) {
          continue;
        }

        if (
          latestEntry === undefined ||
          entry.Timestamp > latestEntry.Timestamp
        ) {
          latestEntry = entry;
        }
      }

      if (latestEntry === undefined) {
        continue;
      }

      const legacyPresence: Record<string, JsValue> = {
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
      presences[currentUser.Email] = legacyPresence;
    }

    return ok({ presences, serverTimestamp });
  } finally {
    db.Dispose();
  }
};
