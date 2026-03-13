import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { resolveTenant, devFetchApiKey } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleDevFetchApiKey = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const tenantResult = await resolveTenant(app.options, app.config, req.get("host") ?? "");
  if (!tenantResult.success) {
    res.status(400).json({ result: "error", msg: tenantResult.error });
    return;
  }

  const body = getBodyObject(req);
  const directEmail = body["direct_email"] as string | undefined;
  if (!directEmail) {
    res.status(400).json({ result: "error", msg: "Missing direct_email", code: "BAD_REQUEST" });
    return;
  }

  const result = await devFetchApiKey(app.options, app.config, tenantResult.data.Id, directEmail);
  if (!result.success) {
    res.status(403).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", ...result.data });
};
