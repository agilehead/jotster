import type { long } from "@tsonic/core/types.js";
import { fs, path } from "@tsonic/nodejs/index.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getAttachmentById } from "../repo/get-attachment-by-id.ts";
import { deleteAttachment } from "../repo/delete-attachment.ts";

export const deleteAttachmentDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  attachmentId: long
): Promise<Result<void, string>> => {
  const attachment = await getAttachmentById(options, user.tenantId, attachmentId);
  if (attachment === undefined) {
    return err("Attachment not found");
  }

  const isOwner = attachment.UserId === user.userId;
  const isAdmin = user.role <= 200;

  if (!isOwner && !isAdmin) {
    return err("You do not have permission to delete this attachment");
  }

  // Delete file from disk
  const filePath = path.join(uploadsDir, String(user.tenantId), attachment.PathId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete DB record
  const deleted = await deleteAttachment(options, user.tenantId, attachmentId);
  if (!deleted) {
    return err("Failed to delete attachment");
  }

  const attObj: Record<string, unknown> = {};
  attObj["id"] = attachment.Id;
  attObj["name"] = attachment.FileName;
  attObj["path_id"] = attachment.PathId;
  attObj["size"] = attachment.Size;
  const eventData: Record<string, unknown> = {};
  eventData["attachment"] = attObj;
  dispatchEventToTenant(user.tenantId, {
    type: "attachment",
    op: "remove",
    data: eventData,
  });

  return ok(undefined);
};
