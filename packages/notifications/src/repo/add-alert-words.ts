import type { long } from "@tsonic/core/types.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  AlertWord,
  generateId,
} from "@jotster/core/Jotster.Core.js";

export const addAlertWords = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
  words: string[],
): Promise<void> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    // Get existing words to skip duplicates
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const existing = await db0.AlertWords.Where(
      (aw) => aw.TenantId === tenantId0,
    )
      .Where((aw) => aw.UserId === userId0)
      .ToListAsync();

    const existingWords = new List<string>();
    for (let i = 0; i < existing.Count; i++) {
      const existingWord = existing[i];
      existingWords.Add(existingWord.Word);
    }

    for (let i = 0; i < words.length; i++) {
      const wordLower = words[i].toLowerCase().trim();
      if (wordLower.length === 0) {
        continue;
      }

      let alreadyExists = false;
      for (let j = 0; j < existingWords.Count; j++) {
        if (existingWords[j] === wordLower) {
          alreadyExists = true;
          break;
        }
      }
      if (alreadyExists) {
        continue;
      }

      const alertWord = new AlertWord();
      alertWord.Id = generateId();
      alertWord.TenantId = tenantId;
      alertWord.UserId = userId;
      alertWord.Word = wordLower;
      alertWord.CreatedAt = now;
      db.AlertWords.Add(alertWord);
      existingWords.Add(wordLower);
    }

    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }
};
