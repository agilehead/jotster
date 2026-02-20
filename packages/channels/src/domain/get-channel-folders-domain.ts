import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ChannelFolder, ChannelFolderItem } from "@jotster/core/Jotster.Core.js";
import { getChannelFolders } from "../repo/get-channel-folders.ts";

interface ChannelFolderWithItems {
  folder: ChannelFolder;
  items: ChannelFolderItem[];
}

export const getChannelFoldersDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<ChannelFolderWithItems[]> => {
  const folders = await getChannelFolders(options, user.tenantId, user.userId);
  return folders;
};
