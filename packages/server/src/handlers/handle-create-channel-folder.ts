import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalStringArrayField, getOptionalStringField } from "../helpers/body.ts";

export const handleCreateChannelFolder = async (
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
  const body = getBodyObject(req);

  const name = getOptionalStringField(body, "name");
  if (name === undefined || name === null) {
    res.status(400).json({ result: "error", msg: "Missing required field: name" });
    return;
  }

  const channels = getOptionalStringArrayField(body, "channels");

  const result = await createChannelFolderDomain(app.options, user, ({
    name,
    channels: channels !== undefined && channels !== null ? channels : undefined,
  }));

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const folder = result.data;
  res.json({
    result: "success",
    msg: "",
    channel_folder_id: folder.Id,
  });
};
