import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, MutedUser, generateId } from "@jotster/core/Jotster.Core.js";

export const muteUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  mutedUserId: string
): Promise<MutedUser> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    const mutedUser = new MutedUser();
    mutedUser.Id = generateId();
    mutedUser.TenantId = tenantId;
    mutedUser.UserId = userId;
    mutedUser.MutedUserId = mutedUserId;
    mutedUser.CreatedAt = now;
    db.MutedUsers.Add(mutedUser);
    await db.SaveChangesAsync();
    return mutedUser;
  } finally {
    db.Dispose();
  }
};
