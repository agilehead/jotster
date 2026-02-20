import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateChannelFolder = async (
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
  const folderId = req.params["folder_id"] as string;
  const body = req.body as Record<string, unknown>;

  const updates: {
    name?: string;
    channels?: string[];
    ordering?: int;
  } = {};

  if (body["name"] !== undefined) {
    updates.name = body["name"] as string;
  }
  if (body["channels"] !== undefined) {
    updates.channels = body["channels"] as string[];
  }
  if (body["ordering"] !== undefined) {
    updates.ordering = body["ordering"] as int;
  }

  const result = await updateChannelFolderDomain(app.options, user, folderId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
