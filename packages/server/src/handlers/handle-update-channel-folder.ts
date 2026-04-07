import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getBodyObject,
  getOptionalStringField,
  hasField,
  toOptionalFlagInt,
  toLong,
} from "../helpers/body.ts";

export const handleUpdateChannelFolder = async (
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
  const folderId = parseId(req.param("folder_id") ?? "");
  if (folderId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid folder_id" });
    return;
  }
  const body = getBodyObject(req);

  const updates: {
    name?: string;
    description?: string;
    isArchived?: int;
  } = {};

  const name = getOptionalStringField(body, "name");
  if (name !== undefined) {
    updates.name = name;
  }
  const description = getOptionalStringField(body, "description");
  if (description !== undefined) {
    updates.description = description;
  }
  if (hasField(body, "is_archived")) {
    const isArchived = toOptionalFlagInt(body["is_archived"]);
    if (isArchived === undefined) {
      res
        .status(400)
        .json({
          result: "error",
          msg: "Invalid is_archived",
          code: "BAD_REQUEST",
        });
      return;
    }
    updates.isArchived = isArchived;
  }

  const result = await updateChannelFolderDomain(
    app.options,
    user,
    toLong(folderId),
    updates,
  );
  if (!result.success) {
    if (result.error === "Must be an organization administrator") {
      res
        .status(400)
        .json({
          result: "error",
          msg: result.error,
          code: "UNAUTHORIZED_PRINCIPAL",
        });
      return;
    }
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
