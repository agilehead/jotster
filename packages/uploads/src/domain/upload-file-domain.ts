import type { long } from "@tsonic/core/types.js";
import { fs, path } from "@tsonic/nodejs/index.js";
import type { UploadedFile } from "@tsonic/express/index.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err, generateId } from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createAttachment } from "../repo/create-attachment.ts";

export const uploadFileDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  file: UploadedFile
): Promise<Result<{ filename: string; uri: string; url: string }, string>> => {
  const fileName = file.originalname;
  const size = file.size as long;
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

  const url = "/user_uploads/" + user.tenantId + "/" + pathId + "/" + encodePathSegment(fileName);
  const uri = url;

  const messagesArr: unknown[] = [];
  const attObj: Record<string, unknown> = {};
  attObj["id"] = attachment.Id;
  attObj["name"] = attachment.FileName;
  attObj["path_id"] = attachment.PathId;
  attObj["size"] = attachment.Size;
  attObj["create_time"] = Convert.ToDouble(attachment.CreatedAt) / 1000;
  attObj["messages"] = messagesArr;
  const eventData: Record<string, unknown> = {};
  eventData["attachment"] = attObj;
  eventData["upload_space_used"] = attachment.Size;
  dispatchEventToTenant(user.tenantId, {
    type: "attachment",
    op: "add",
    data: eventData,
  });

  return ok({ uri, url, filename: fileName });
};

const encodePathSegment = (value: string): string => {
  return value
    .replaceAll("%", "%25")
    .replaceAll(" ", "%20")
    .replaceAll("#", "%23")
    .replaceAll("?", "%3F")
    .replaceAll("[", "%5B")
    .replaceAll("]", "%5D");
};
