import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, User } from "@jotster/core/Jotster.Core.js";

export async function getUser(
  options: DbContextOptions,
  userId: string
): Promise<User | undefined> {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const result = await db0.Users.Where((u) => u.Id === userId0).FirstOrDefaultAsync();
    return result ?? undefined;
  } finally {
    db.Dispose();
  }
}
