import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getChannelFoldersDomain } from "@jotster/channels/Jotster.Channels.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalBooleanField } from "../helpers/body.ts";
import { mapChannelFolderToCompatResponse } from "../helpers/compat-mappers.ts";

export const handleGetChannelFolders = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const includeArchived =
    getOptionalBooleanField(
      req.query as Record<string, JsValue>,
      "include_archived",
    ) === true;
  const foldersWithItems = await getChannelFoldersDomain(
    app.options,
    user,
    includeArchived,
  );

  const channel_folders = new List<Record<string, JsValue>>();
  for (let i = 0; i < foldersWithItems.length; i++) {
    const entry = foldersWithItems[i];
    channel_folders.Add(mapChannelFolderToCompatResponse(entry.folder));
  }

  res.json({
    result: "success",
    msg: "",
    channel_folders: channel_folders.ToArray(),
  });
};
