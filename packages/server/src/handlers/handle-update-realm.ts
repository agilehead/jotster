import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateOrgSettingsDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateRealm = async (
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
  const body = req.body as Record<string, JsValue>;

  // Build settings from body - pass through all provided fields
  const settings: Record<string, JsValue> = {};
  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i++) {
    settings[keys[i]] = body[keys[i]];
  }

  if (Object.keys(settings).length === 0) {
    res.status(400).json({ result: "error", msg: "No settings provided" });
    return;
  }

  const result = await updateOrgSettingsDomain(app.options, user, settings);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
