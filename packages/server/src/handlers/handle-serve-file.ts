import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { serveFileDomain } from "@jotster/uploads/Jotster.Uploads.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleServeFile = async (
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
  const tenantId = req.params["tenant_id"] as string;
  const pathId = req.params["path_id"] as string;

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const result = await serveFileDomain(app.options, user, uploadsDir, tenantId, pathId);
  if (!result.success) {
    res.status(404).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.set("Content-Type", data.contentType);
  res.set("Content-Disposition", "inline; filename=\"" + data.fileName + "\"");
  res.sendFile(data.filePath);
};
