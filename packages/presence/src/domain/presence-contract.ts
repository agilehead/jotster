import type { int, long } from "@tsonic/core/types.js";
import { Convert, DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { Presence } from "@jotster/core/Jotster.Core.js";

export interface ModernPresenceEntry {
  active_timestamp?: long;
  idle_timestamp?: long;
}

export interface LegacyUserPresenceEntry {
  status: string;
  timestamp: long;
}

export interface LegacyRealmPresenceEntry {
  client: string;
  pushable: boolean;
  status: string;
  timestamp: long;
}

const DEFAULT_HISTORY_LIMIT_DAYS = 14 as int;
const MILLIS_PER_DAY = 86400000 as long;

const getHistoryLimitDays = (historyLimitDays?: int): int => {
  if (historyLimitDays === undefined) {
    return DEFAULT_HISTORY_LIMIT_DAYS;
  }
  const days = Convert.ToInt32(historyLimitDays);
  return days < (0 as int) ? (0 as int) : days;
};

export const filterPresenceEntries = (
  entries: Presence[],
  historyLimitDays?: int,
  lastUpdateId?: long,
): Presence[] => {
  const result: Presence[] = [];

  if (lastUpdateId !== undefined && Convert.ToDouble(lastUpdateId) > 0) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (Convert.ToDouble(entry.Timestamp) > Convert.ToDouble(lastUpdateId)) {
        result.push(entry);
      }
    }
    return result;
  }

  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
  const days = getHistoryLimitDays(historyLimitDays);
  const cutoff = Convert.ToInt64(
    Convert.ToDouble(now) -
      Convert.ToDouble(days) * Convert.ToDouble(MILLIS_PER_DAY),
  );

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (Convert.ToDouble(entry.Timestamp) >= Convert.ToDouble(cutoff)) {
      result.push(entry);
    }
  }

  return result;
};

export const getPresenceLastUpdateId = (
  entries: Presence[],
  lastUpdateId?: long,
): long => {
  let latest = 0 as long;

  for (let i = 0; i < entries.length; i++) {
    if (Convert.ToDouble(entries[i].Timestamp) > Convert.ToDouble(latest)) {
      latest = entries[i].Timestamp;
    }
  }

  if (Convert.ToDouble(latest) > 0) {
    return latest;
  }

  if (lastUpdateId !== undefined) {
    const currentLastUpdateId = Convert.ToInt64(lastUpdateId);
    return currentLastUpdateId;
  }

  return Convert.ToInt64(-1);
};

export const buildModernPresenceMap = (
  entries: Presence[],
): Record<string, unknown> => {
  const userIds: long[] = [];
  const activeTimestamps: long[] = [];
  const idleTimestamps: long[] = [];
  const hasActiveTimestamps: boolean[] = [];
  const hasIdleTimestamps: boolean[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let currentIndex = -1;
    for (let j = 0; j < userIds.length; j++) {
      if (userIds[j] === entry.UserId) {
        currentIndex = j;
        break;
      }
    }

    if (currentIndex === -1) {
      userIds.push(entry.UserId);
      activeTimestamps.push(0 as long);
      idleTimestamps.push(0 as long);
      hasActiveTimestamps.push(false);
      hasIdleTimestamps.push(false);
      currentIndex = userIds.length - 1;
    }

    if (entry.Status === "active") {
      const activeTimestamp = activeTimestamps[currentIndex];
      if (
        !hasActiveTimestamps[currentIndex] ||
        Convert.ToDouble(entry.Timestamp) > Convert.ToDouble(activeTimestamp)
      ) {
        activeTimestamps[currentIndex] = entry.Timestamp;
        hasActiveTimestamps[currentIndex] = true;
      }
    } else if (entry.Status === "idle") {
      const idleTimestamp = idleTimestamps[currentIndex];
      if (
        !hasIdleTimestamps[currentIndex] ||
        Convert.ToDouble(entry.Timestamp) > Convert.ToDouble(idleTimestamp)
      ) {
        idleTimestamps[currentIndex] = entry.Timestamp;
        hasIdleTimestamps[currentIndex] = true;
      }
    }
  }

  const presences: Record<string, unknown> = {};
  for (let i = 0; i < userIds.length; i++) {
    const presence: Record<string, unknown> = {};
    if (hasActiveTimestamps[i]) {
      presence["active_timestamp"] = activeTimestamps[i] as unknown;
    }
    if (hasIdleTimestamps[i]) {
      presence["idle_timestamp"] = idleTimestamps[i] as unknown;
    }
    presences[Convert.ToString(userIds[i])] = presence as unknown;
  }

  return presences;
};

export const buildLegacyUserPresenceMap = (
  entries: Presence[],
): Record<string, unknown> => {
  let latestStatus = "";
  let latestTimestamp = 0 as long;
  let hasLatest = false;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (
      !hasLatest ||
      Convert.ToDouble(entry.Timestamp) > Convert.ToDouble(latestTimestamp)
    ) {
      latestTimestamp = entry.Timestamp;
      latestStatus = entry.Status;
      hasLatest = true;
    }
  }

  if (!hasLatest) {
    return {};
  }

  return {
    website: {
      status: latestStatus,
      timestamp: latestTimestamp,
    } as unknown,
    aggregated: {
      status: latestStatus,
      timestamp: latestTimestamp,
    } as unknown,
  };
};
