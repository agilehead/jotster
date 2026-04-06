import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";
import { deleteChannelFolder } from "../repo/delete-channel-folder.ts";

export const deleteChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  folderId: long,
): Promise<Result<boolean, string>> => {
  if (user.role > 200) {
    return err("Must be an organization administrator");
  }

  const existing = await getChannelFolderById(options, folderId);
  if (existing === undefined) {
    return err("Channel folder not found");
  }

  if (existing.folder.TenantId !== user.tenantId) {
    return err("Channel folder not found");
  }

  const result = await deleteChannelFolder(options, folderId);
  if (!result) {
    return err("Channel folder not found");
  }

  const eventData: Record<string, JsValue> = {};
  eventData["channel_folder_id"] = folderId;
  dispatchEventToTenant(user.tenantId, {
    type: "channel_folder",
    op: "remove",
    data: eventData,
  });

  return ok(true);
};
