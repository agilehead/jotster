import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserSettingDefaultsDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateUserSettingDefaults = async (
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
  const body = req.body as Record<string, unknown>;

  // Pass all body fields as setting updates
  const updates: Record<string, unknown> = {};
  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i++) {
    updates[keys[i]] = body[keys[i]];
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ result: "error", msg: "No settings provided" });
    return;
  }

  const result = await updateUserSettingDefaultsDomain(app.options, user, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
