import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelFoldersDomain } from "@jotster/channels/Jotster.Channels.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetChannelFolders = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const foldersWithItems = await getChannelFoldersDomain(app.options, user);

  const channel_folders = new List<Record<string, unknown>>();
  for (let i = 0; i < foldersWithItems.length; i++) {
    const entry = foldersWithItems[i];
    const folder: Record<string, unknown> = {};
    folder["id"] = entry.folder.Id;
    folder["name"] = entry.folder.Name;
    folder["ordering"] = entry.folder.Ordering;

    const channelIds = new List<string>();
    for (let j = 0; j < entry.items.length; j++) {
      channelIds.Add(entry.items[j].ChannelId);
    }
    folder["channels"] = channelIds.ToArray();

    channel_folders.Add(folder);
  }

  res.json({ result: "success", msg: "", channel_folders: channel_folders.ToArray() });
};
