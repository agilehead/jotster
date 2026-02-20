import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getRealmPresence } from "../repo/get-realm-presence.ts";

const PRESENCE_STALE_THRESHOLD_MS = 300000 as long; // 5 minutes in ms

interface ClientPresence {
  status: string;
  timestamp: long;
}

interface SlimUserPresence {
  active_timestamp?: long;
  idle_timestamp?: long;
}

interface RealmPresenceResult {
  presences: Record<string, Record<string, ClientPresence> | SlimUserPresence>;
  serverTimestamp: long;
}

export const getRealmPresenceDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  slimPresence?: boolean
): Promise<Result<RealmPresenceResult, string>> => {
  const allPresences = await getRealmPresence(options, user.tenantId);
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
  const serverTimestamp = now;

  // Group by user, filtering out stale entries
  const userPresenceMap: Record<string, { clientName: string; status: string; timestamp: long }[]> = {};

  for (let i = 0; i < allPresences.Length; i++) {
    const p = allPresences[i];
    const age = (Number(now) - Number(p.Timestamp)) as long;
    if (Number(age) > Number(PRESENCE_STALE_THRESHOLD_MS)) {
      continue;
    }

    if (userPresenceMap[p.UserId] === undefined) {
      userPresenceMap[p.UserId] = [];
    }
    const presenceList = new List<{ clientName: string; status: string; timestamp: long }>();
    for (let pi = 0; pi < userPresenceMap[p.UserId].length; pi++) {
      presenceList.Add(userPresenceMap[p.UserId][pi]);
    }
    presenceList.Add({
      clientName: p.ClientName,
      status: p.Status,
      timestamp: p.Timestamp,
    });
    userPresenceMap[p.UserId] = presenceList.ToArray();
  }

  if (slimPresence === true) {
    // Slim format: { userId: { active_timestamp, idle_timestamp } }
    const presences: Record<string, SlimUserPresence> = {};
    const userIds = Object.keys(userPresenceMap);

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const entries = userPresenceMap[userId];
      const slim: SlimUserPresence = {};

      for (let j = 0; j < entries.length; j++) {
        const entry = entries[j];
        if (entry.status === "active") {
          if (slim.active_timestamp === undefined || Number(entry.timestamp) > Number(slim.active_timestamp)) {
            slim.active_timestamp = entry.timestamp;
          }
        } else if (entry.status === "idle") {
          if (slim.idle_timestamp === undefined || Number(entry.timestamp) > Number(slim.idle_timestamp)) {
            slim.idle_timestamp = entry.timestamp;
          }
        }
      }

      presences[userId] = slim;
    }

    return ok({ presences, serverTimestamp });
  }

  // Legacy format: { email: { aggregated: {...}, clientName: {...}, ... } }
  // Need to look up emails for each user
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const users = await db0.Users
      .Where((u) => u.TenantId === tenantId0)
      .ToArrayAsync();

    // Build userId -> email map
    const emailMap: Record<string, string> = {};
    for (let i = 0; i < users.Length; i++) {
      emailMap[users[i].Id] = users[i].Email;
    }

    const presences: Record<string, Record<string, ClientPresence>> = {};
    const userIds = Object.keys(userPresenceMap);

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const email = emailMap[userId];
      if (email === undefined) {
        continue;
      }

      const entries = userPresenceMap[userId];
      const userPresence: Record<string, ClientPresence> = {};
      let latestTimestamp = 0 as long;
      let aggregatedStatus = "offline";

      for (let j = 0; j < entries.length; j++) {
        const entry = entries[j];
        userPresence[entry.clientName] = {
          status: entry.status,
          timestamp: entry.timestamp,
        };

        if (Number(entry.timestamp) > Number(latestTimestamp)) {
          latestTimestamp = entry.timestamp;
          aggregatedStatus = entry.status;
        }
      }

      if (aggregatedStatus !== "offline") {
        userPresence["aggregated"] = {
          status: aggregatedStatus,
          timestamp: latestTimestamp,
        };
      }

      presences[email] = userPresence;
    }

    return ok({ presences, serverTimestamp });
  } finally {
    db.Dispose();
  }
};
