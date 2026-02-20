import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { deleteAttachmentDomain } from "@jotster/uploads/Jotster.Uploads.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDeleteAttachment = async (
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
  const attachmentId = req.params["attachment_id"] as string;

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const result = await deleteAttachmentDomain(app.options, user, uploadsDir, attachmentId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
