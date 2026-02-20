import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ApiKey, generateId } from "@jotster/core/Jotster.Core.js";

export const createApiKey = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  keyHash: string
): Promise<ApiKey> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    const apiKey = new ApiKey();
    apiKey.Id = generateId();
    apiKey.TenantId = tenantId;
    apiKey.UserId = userId;
    apiKey.KeyHash = keyHash;
    apiKey.CreatedAt = now;
    db.ApiKeys.Add(apiKey);
    await db.SaveChangesAsync();
    return apiKey;
  } finally {
    db.Dispose();
  }
};
