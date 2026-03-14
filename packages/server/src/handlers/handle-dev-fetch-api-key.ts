import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
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
  const username = getOptionalStringField(body, "username") ?? getOptionalStringField(body, "direct_email");
  if (!username) {
    res.status(400).json({ result: "error", msg: "Missing username", code: "BAD_REQUEST" });
    return;
  }

  const result = await devFetchApiKey(app.options, app.config, tenantResult.data.Id, username);
  if (!result.success) {
    res.status(403).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    api_key: result.data.api_key,
    email: result.data.email,
    user_id: result.data.user_id,
  });
};
