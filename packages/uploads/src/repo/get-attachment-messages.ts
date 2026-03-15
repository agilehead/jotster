import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  AttachmentMessage,
} from "@jotster/core/Jotster.Core.js";

export const getAttachmentMessages = async (
  options: DbContextOptions,
  attachmentId: long,
): Promise<AttachmentMessage[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const attachmentId0 = attachmentId;
    const result = await db0.AttachmentMessages.Where(
      (am) => am.AttachmentId === attachmentId0,
    ).ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
