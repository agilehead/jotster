import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, AlertWord, generateId } from "@jotster/core/Jotster.Core.js";

export const addAlertWords = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  words: string[]
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    // Get existing words to skip duplicates
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const existing = await db0.AlertWords
      .Where((aw) => aw.TenantId === tenantId0).Where((aw) => aw.UserId === userId0)
      .ToArrayAsync();

    const existingWords: Record<string, boolean> = {};
    for (let i = 0; i < existing.length; i++) {
      existingWords[existing[i].Word] = true;
    }

    for (let i = 0; i < words.length; i++) {
      const wordLower = words[i].toLowerCase().trim();
      if (wordLower.length === 0) {
        continue;
      }
      if (existingWords[wordLower] === true) {
        continue;
      }

      const alertWord = new AlertWord();
      alertWord.Id = generateId();
      alertWord.TenantId = tenantId;
      alertWord.UserId = userId;
      alertWord.Word = wordLower;
      alertWord.CreatedAt = now;
      db.AlertWords.Add(alertWord);
      existingWords[wordLower] = true;
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
