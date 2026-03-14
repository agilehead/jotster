import type { Request, Response } from "@tsonic/express/index.js";
import { resolveTenant, getServerSettings } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetServerSettings = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const tenantResult = await resolveTenant(app.options, app.config, req.get("host") ?? "");
  if (!tenantResult.success) {
    res.status(400).json({ result: "error", msg: tenantResult.error });
    return;
  }

  const settings = getServerSettings(tenantResult.data);
  res.json({ result: "success", msg: "", ...settings });
};
