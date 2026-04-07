import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteAttachmentDomain } from "@jotster/uploads/Jotster.Uploads.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteAttachment = async (
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
  const attachmentId = parseId(req.param("attachment_id") ?? "");
  if (attachmentId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid attachment_id" });
    return;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const result = await deleteAttachmentDomain(
    app.options,
    user,
    uploadsDir,
    toLong(attachmentId),
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
