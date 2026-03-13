import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";
import { deleteChannelFolder } from "../repo/delete-channel-folder.ts";

export const deleteChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  folderId: string
): Promise<Result<boolean, string>> => {
  const existing = await getChannelFolderById(options, folderId);
  if (existing === undefined) {
    return err("Channel folder not found");
  }

  // Validate ownership
  if (existing.folder.UserId !== user.userId || existing.folder.TenantId !== user.tenantId) {
    return err("Channel folder not found");
  }

  const result = await deleteChannelFolder(options, folderId);
  if (!result) {
    return err("Channel folder not found");
  }

  const eventData: Record<string, unknown> = {};
  eventData["channel_folder_id"] = folderId;
  dispatchEventToUser(user.tenantId, user.userId, {
    type: "channel_folder",
    op: "remove",
    data: eventData,
  });

  return ok(true);
};
