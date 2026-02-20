import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export const updateUser = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  updates: { fullName?: string; role?: int; timezone?: string }
): Promise<User | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const user = await db0.Users
      .Where((u) => u.Id === userId0).Where((u) => u.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (user === undefined) {
      return undefined;
    }

    if (updates.fullName !== undefined) {
      user.FullName = updates.fullName;
    }
    if (updates.role !== undefined) {
      user.Role = updates.role;
    }
    if (updates.timezone !== undefined) {
      user.Timezone = updates.timezone;
    }

    user.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return user;
  } finally {
    db.Dispose();
  }
};
