import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "./db/jotster-db-context.ts";
import { PublicIdCounter } from "./db/entities/public-id-counter.ts";

const MAX_ALLOCATE_ATTEMPTS = 8;

export type PublicEntityType =
  | "tenant"
  | "user"
  | "channel"
  | "message"
  | "user_group"
  | "channel_folder"
  | "attachment"
  | "custom_emoji"
  | "custom_profile_field"
  | "draft"
  | "saved_snippet"
  | "reminder"
  | "scheduled_message"
  | "navigation_view"
  | "linkifier"
  | "invitation"
  | "data_export";

export async function allocatePublicId(
  options: DbContextOptions,
  entityType: PublicEntityType,
): Promise<long> {
  for (let attempt = 0; attempt < MAX_ALLOCATE_ATTEMPTS; attempt++) {
    const db = new JotsterDbContext(options);
    try {
      const entityType0 = entityType;
      let counter = await db.PublicIdCounters
        .Where((entry) => entry.EntityType === entityType0)
        .FirstOrDefaultAsync();

      if (counter === undefined || counter === null) {
        counter = new PublicIdCounter();
        counter.EntityType = entityType;
        counter.NextValue = 2 as long;
        db.PublicIdCounters.Add(counter);
        await db.SaveChangesAsync();
        return 1 as long;
      }

      const allocated = counter.NextValue;
      counter.NextValue = (counter.NextValue + 1) as long;
      await db.SaveChangesAsync();
      return allocated;
    } catch {
      if (attempt === MAX_ALLOCATE_ATTEMPTS - 1) {
        throw new Error(`Failed to allocate public id for ${entityType}`);
      }
    } finally {
      db.Dispose();
    }
  }

  throw new Error(`Failed to allocate public id for ${entityType}`);
}

export const parsePublicId = (value: string | undefined): long | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return undefined;
  }

  const parsed = Convert.ToInt64(trimmed);
  return parsed < 1 ? undefined : (parsed as long);
};

export const publicIdToNumber = (value: long | undefined): number | null =>
  value === undefined ? null : Number(value);
