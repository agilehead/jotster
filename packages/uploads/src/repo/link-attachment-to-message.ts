import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, AttachmentMessage } from "@jotster/core/Jotster.Core.js";

export const linkAttachmentToMessage = async (
  options: DbContextOptions,
  attachmentId: long,
  messageId: long
): Promise<AttachmentMessage> => {
  const link = new AttachmentMessage();
  link.AttachmentId = attachmentId;
  link.MessageId = messageId;

  const db = new JotsterDbContext(options);
  try {
    db.AttachmentMessages.Add(link);
    await db.SaveChangesAsync();
    return link;
  } finally {
    db.Dispose();
  }
};
