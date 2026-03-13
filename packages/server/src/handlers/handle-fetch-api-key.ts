import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { resolveTenant, fetchApiKey } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleFetchApiKey = async (
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
  const username = body["username"] as string | undefined;
  const password = body["password"] as string | undefined;
  if (!username || !password) {
    res.status(400).json({ result: "error", msg: "Missing username or password", code: "BAD_REQUEST" });
    return;
  }

  const result = await fetchApiKey(app.options, tenantResult.data.Id, username, password);
  if (!result.success) {
    res.status(403).json({ result: "error", msg: result.error, code: "UNAUTHORIZED" });
    return;
  }

  res.json({ result: "success", msg: "", ...result.data });
};
