import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteChannelFolderDomain } from "@jotster/channels/Jotster.Channels.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteChannelFolder = async (
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

  const result = await deleteChannelFolderDomain(
    app.options,
    user,
    toLong(folderId),
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
