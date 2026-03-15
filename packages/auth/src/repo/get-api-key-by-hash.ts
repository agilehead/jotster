import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ApiKey } from "@jotster/core/Jotster.Core.js";

export const getApiKeyByHash = async (
  options: DbContextOptions,
  keyHash: string,
): Promise<ApiKey | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const hash0 = keyHash;
    const result = await db0.ApiKeys.Where((k) => k.KeyHash === hash0)
      .Where((k) => k.RevokedAt === undefined)
      .FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
};
