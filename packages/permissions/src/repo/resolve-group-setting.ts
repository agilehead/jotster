import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, parseId } from "@jotster/core/Jotster.Core.js";

/**
 * Resolve a group setting value (which may be a numeric ID or a system group name
 * like "role:members") to a numeric group ID.
 */
export const resolveGroupSettingToId = async (
  options: DbContextOptions,
  tenantId: long,
  value: string
): Promise<long | undefined> => {
  // Try parsing as a numeric ID first
  const numericId = parseId(value);
  if (numericId !== undefined) {
    return numericId;
  }

  // Otherwise, resolve as a system group name
  if (!value.startsWith("role:")) {
    return undefined;
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const value0 = value;
    const one = 1 as int;
    const group = await db0.UserGroups
      .Where((g) => g.TenantId === tenantId0).Where((g) => g.IsSystemGroup === one).Where((g) => g.Name === value0)
      .FirstOrDefaultAsync();

    if (group === undefined || group === null) {
      return undefined;
    }

    return group.Id;
  } finally {
    db.Dispose();
  }
};

/**
 * Resolve a numeric group ID to a group name (for system groups) or return
 * the numeric ID unchanged (for custom groups). Returns undefined if the ID
 * doesn't match any group.
 */
export const resolveGroupIdToSetting = async (
  options: DbContextOptions,
  tenantId: long,
  groupId: long | undefined | null
): Promise<string | null> => {
  if (groupId === undefined || groupId === null) {
    return null;
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const groupId0 = groupId;
    const group = await db0.UserGroups
      .Where((g) => g.TenantId === tenantId0).Where((g) => g.Id === groupId0)
      .FirstOrDefaultAsync();

    if (group === undefined || group === null) {
      return null;
    }

    if (group.IsSystemGroup === 1) {
      return group.Name;
    }

    // For custom groups, return the numeric ID as a number
    // (the caller will decide how to serialize)
    return `${group.Id}`;
  } finally {
    db.Dispose();
  }
};
