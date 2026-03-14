import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { initiateExportDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";

export const handleCreateExport = async (
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
  const exportType = getOptionalStringField(body, "export_type") ?? "full";

  const result = await initiateExportDomain(app.options, user, exportType);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", id: result.data });
};
