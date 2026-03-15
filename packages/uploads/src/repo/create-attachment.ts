import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Attachment } from "@jotster/core/Jotster.Core.js";

interface CreateAttachmentInput {
  tenantId: long;
  userId: long;
  fileName: string;
  pathId: string;
  size: long;
  contentType: string;
}

export const createAttachment = async (
  options: DbContextOptions,
  input: CreateAttachmentInput,
): Promise<Attachment> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const attachment = new Attachment();
  attachment.TenantId = input.tenantId;
  attachment.UserId = input.userId;
  attachment.FileName = input.fileName;
  attachment.PathId = input.pathId;
  attachment.Size = input.size;
  attachment.ContentType = input.contentType;
  attachment.IsWebPublic = 0 as int;
  attachment.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Attachments.Add(attachment);
    await db.SaveChangesAsync();
    return attachment;
  } finally {
    db.Dispose();
  }
};
