import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalIntField, getOptionalStringArrayField, getOptionalStringField, hasField } from "../helpers/body.ts";

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
  const body = getBodyObject(req);

  const updates: {
    name?: string;
    channels?: string[];
    ordering?: int;
  } = {};

  const name = getOptionalStringField(body, "name");
  if (name !== undefined) {
    updates.name = name;
  }
  const channels = getOptionalStringArrayField(body, "channels");
  if (channels !== undefined) {
    updates.channels = channels;
  }
  if (hasField(body, "ordering")) {
    const ordering = getOptionalIntField(body, "ordering");
    if (ordering === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid ordering" });
      return;
    }
    updates.ordering = ordering;
  }

  const result = await updateChannelFolderDomain(app.options, user, folderId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
