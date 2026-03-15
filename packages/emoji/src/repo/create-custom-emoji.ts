import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, CustomEmoji } from "@jotster/core/Jotster.Core.js";

interface CreateCustomEmojiInput {
  tenantId: long;
  name: string;
  fileName: string;
  authorId: long;
}

export const createCustomEmoji = async (
  options: DbContextOptions,
  input: CreateCustomEmojiInput,
): Promise<CustomEmoji> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const emoji = new CustomEmoji();
  emoji.TenantId = input.tenantId;
  emoji.Name = input.name;
  emoji.FileName = input.fileName;
  emoji.AuthorId = input.authorId;
  emoji.IsActive = 1 as int;
  emoji.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.CustomEmojis.Add(emoji);
    await db.SaveChangesAsync();
    return emoji;
  } finally {
    db.Dispose();
  }
};
