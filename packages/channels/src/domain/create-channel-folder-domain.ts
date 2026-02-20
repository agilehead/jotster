import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ChannelFolder, ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createChannelFolder } from "../repo/create-channel-folder.ts";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";

interface CreateChannelFolderDomainInput {
  name: string;
  channels?: string[];
}

export const createChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateChannelFolderDomainInput
): Promise<Result<ChannelFolder, string>> => {
  const name = input.name.Trim();

  if (name.Length === 0) {
    return err("Folder name must not be empty");
  }

  const folder = await createChannelFolder(options, {
    tenantId: user.tenantId,
    userId: user.userId,
    name,
    channels: input.channels,
  });

  // Fetch folder with items for the event
  const folderWithItems = await getChannelFolderById(options, folder.Id);

  if (folderWithItems !== undefined) {
    const channelIds = new List<string>();
    for (let i = 0; i < folderWithItems.items.length; i++) {
      channelIds.Add(folderWithItems.items[i].ChannelId);
    }

    dispatchEventToUser(user.tenantId, user.userId, {
      type: "channel_folder",
      op: "add",
      data: {
        channel_folder: {
          id: folder.Id,
          name: folder.Name,
          channels: channelIds.ToArray(),
          ordering: folder.Ordering,
        },
      },
    });
  }

  return ok(folder);
};
