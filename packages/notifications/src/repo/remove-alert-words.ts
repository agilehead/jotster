import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";

export const removeAlertWords = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  words: string[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    for (let i = 0; i < words.length; i++) {
      const wordLower = words[i].ToLower().Trim();
      if (wordLower.Length === 0) {
        continue;
      }

      const db0 = db;
      const tenantId0 = tenantId;
      const userId0 = userId;
      const wordLower0 = wordLower;
      const existing = await db0.AlertWords
        .Where((aw) => aw.TenantId === tenantId0).Where((aw) => aw.UserId === userId0).Where((aw) => aw.Word === wordLower0)
        .FirstOrDefaultAsync();

      if (existing !== undefined && existing !== null) {
        db.AlertWords.Remove(existing);
      }
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
