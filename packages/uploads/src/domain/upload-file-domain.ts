import type { int } from "@tsonic/core/types.js";
import { fs, path } from "@tsonic/nodejs/index.js";
import type { UploadedFile } from "@tsonic/express/index.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err, generateId } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createAttachment } from "../repo/create-attachment.ts";

export const uploadFileDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  file: UploadedFile
): Promise<Result<{ uri: string }, string>> => {
  const fileName = file.originalname;
  const size = file.size as int;
  const contentType = file.mimetype;

  const ext = path.extname(fileName);
  const pathId = generateId() + ext;

  const dirPath = path.join(uploadsDir, user.tenantId);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, pathId);
  await file.save(filePath);

  const attachment = await createAttachment(options, {
    tenantId: user.tenantId,
    userId: user.userId,
    fileName,
    pathId,
    size,
    contentType,
  });

  const uri = "/user_uploads/" + user.tenantId + "/" + pathId;

  dispatchEventToTenant(user.tenantId, {
    type: "attachment",
    op: "add",
    data: {
      attachment: {
        id: attachment.Id,
        name: attachment.FileName,
        path_id: attachment.PathId,
        size: attachment.Size,
        create_time: Number(attachment.CreatedAt) / 1000,
        messages: [],
      },
      upload_space_used: attachment.Size,
    },
  });

  return ok({ uri });
};
