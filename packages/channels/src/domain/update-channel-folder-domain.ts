import type { JsValue, int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ChannelFolder, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";
import { getChannelFolders } from "../repo/get-channel-folders.ts";
import { updateChannelFolder } from "../repo/update-channel-folder.ts";
import type { ChannelFolderEventUpdates } from "./map-channel-folder-event.ts";
import { mapChannelFolderUpdateData } from "./map-channel-folder-event.ts";

type UpdateChannelFolderDomainInput = ChannelFolderEventUpdates;

export const updateChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  folderId: long,
  updates: UpdateChannelFolderDomainInput,
): Promise<Result<ChannelFolder, string>> => {
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

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length === 0) {
      return err("Folder name must not be empty");
    }

    const existingFolders = await getChannelFolders(
      options,
      user.tenantId,
      true,
    );
    for (let i = 0; i < existingFolders.length; i++) {
      const folder = existingFolders[i].folder;
      if (folder.Id !== folderId && folder.Name === name) {
        return err("Channel folder with this name already exists");
      }
    }
  }

  const updated = await updateChannelFolder(options, folderId, {
    name: updates.name !== undefined ? updates.name.trim() : undefined,
    description: updates.description,
    isArchived: updates.isArchived,
  });

  if (updated === undefined) {
    return err("Channel folder not found");
  }

  const folderWithItems = await getChannelFolderById(options, folderId);

  if (folderWithItems !== undefined) {
    const eventData: Record<string, JsValue> = {};
    eventData["channel_folder_id"] = updated.Id;
    eventData["data"] = mapChannelFolderUpdateData(updated, updates);
    dispatchEventToTenant(user.tenantId, {
      type: "channel_folder",
      op: "update",
      data: eventData,
    });
  }

  return ok(updated);
};
