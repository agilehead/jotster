import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getExportConsents } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetExportConsents = async (
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

  // Validate admin role (<= 200)
  if (user.role > 200) {
    res.status(400).json({ result: "error", msg: "Insufficient permission" });
    return;
  }

  const exportConsents = await getExportConsents(app.options, user.tenantId);
  res.json({ result: "success", msg: "", export_consents: exportConsents });
};
