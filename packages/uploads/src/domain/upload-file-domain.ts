import type { JsValue, long } from "@tsonic/core/types.js";
import { existsSync, mkdirSync } from "@tsonic/nodejs/fs.js";
import { extname, join } from "@tsonic/nodejs/path.js";
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
  file: UploadedFile,
): Promise<Result<{ filename: string; uri: string; url: string }, string>> => {
  const fileName = file.originalname;
  const size = Convert.ToInt64(file.size);
  const contentType = file.mimetype;

  const ext = extname(fileName);
  const pathId = generateId() + ext;

  const tenantIdStr = String(user.tenantId);
  const dirPath = join(uploadsDir, tenantIdStr);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, true);
  }

  const filePath = join(dirPath, pathId);
  await file.save(filePath);

  const attachment = await createAttachment(options, {
    tenantId: user.tenantId,
    userId: user.userId,
    fileName,
    pathId,
    size,
    contentType,
  });

  const url =
    "/user_uploads/" +
    tenantIdStr +
    "/" +
    pathId +
    "/" +
    encodePathSegment(fileName);
  const uri = url;

  const messagesArr: JsValue[] = [];
  const attObj: Record<string, JsValue> = {};
  attObj["id"] = attachment.Id;
  attObj["name"] = attachment.FileName;
  attObj["path_id"] = attachment.PathId;
  attObj["size"] = attachment.Size;
  attObj["create_time"] = Convert.ToDouble(attachment.CreatedAt) / 1000;
  attObj["messages"] = messagesArr;
  const eventData: Record<string, JsValue> = {};
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
