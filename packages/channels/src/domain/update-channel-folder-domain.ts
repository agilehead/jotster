import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ChannelFolder, ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";
import { updateChannelFolder } from "../repo/update-channel-folder.ts";

interface UpdateChannelFolderDomainInput {
  name?: string;
  channels?: string[];
  ordering?: int;
}

export const updateChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  folderId: string,
  updates: UpdateChannelFolderDomainInput
): Promise<Result<ChannelFolder, string>> => {
  const existing = await getChannelFolderById(options, folderId);
  if (existing === undefined) {
    return err("Channel folder not found");
  }

  // Validate ownership
  if (existing.folder.UserId !== user.userId || existing.folder.TenantId !== user.tenantId) {
    return err("Channel folder not found");
  }

  // Validate name if changing
  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length === 0) {
      return err("Folder name must not be empty");
    }
  }

  const updated = await updateChannelFolder(options, folderId, {
    name: updates.name !== undefined ? updates.name.trim() : undefined,
    channels: updates.channels,
    ordering: updates.ordering,
  });

  if (updated === undefined) {
    return err("Channel folder not found");
  }

  // Fetch updated folder with items for the event
  const folderWithItems = await getChannelFolderById(options, folderId);

  if (folderWithItems !== undefined) {
    const channelIds = new List<string>();
    for (let i = 0; i < folderWithItems.items.length; i++) {
      channelIds.Add(folderWithItems.items[i].ChannelId);
    }

    const folderObj: Record<string, unknown> = {};
    folderObj["id"] = updated.Id;
    folderObj["name"] = updated.Name;
    folderObj["channels"] = channelIds.ToArray();
    folderObj["ordering"] = updated.Ordering;
    const eventData: Record<string, unknown> = {};
    eventData["channel_folder"] = folderObj;
    dispatchEventToUser(user.tenantId, user.userId, {
      type: "channel_folder",
      op: "update",
      data: eventData,
    });
  }

  return ok(updated);
};
