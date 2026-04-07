import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ChannelFolder, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { createChannelFolder } from "../repo/create-channel-folder.ts";
import { getChannelFolderById } from "../repo/get-channel-folder-by-id.ts";
import { getChannelFolders } from "../repo/get-channel-folders.ts";
import { mapChannelFolderToAddEventRecord } from "./map-channel-folder-event.ts";

interface CreateChannelFolderDomainInput {
  name: string;
  description?: string;
}

export const createChannelFolderDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateChannelFolderDomainInput,
): Promise<Result<ChannelFolder, string>> => {
  if (user.role > 200) {
    return err("Must be an organization administrator");
  }

  const name = input.name.trim();

  if (name.length === 0) {
    return err("Folder name must not be empty");
  }

  const existingFolders = await getChannelFolders(options, user.tenantId, true);
  for (let i = 0; i < existingFolders.length; i++) {
    if (existingFolders[i].folder.Name === name) {
      return err("Channel folder with this name already exists");
    }
  }

  const description = (input.description ?? "").trim();

  const folder = await createChannelFolder(options, {
    tenantId: user.tenantId,
    userId: user.userId,
    name,
    description,
  });

  const folderWithItems = await getChannelFolderById(options, folder.Id);

  if (folderWithItems !== undefined) {
    const eventData: Record<string, JsValue> = {};
    eventData["channel_folder"] = mapChannelFolderToAddEventRecord(folder);
    dispatchEventToTenant(user.tenantId, {
      type: "channel_folder",
      op: "add",
      data: eventData,
    });
  }

  return ok(folder);
};
