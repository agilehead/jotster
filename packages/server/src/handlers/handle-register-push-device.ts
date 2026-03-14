import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { registerDeviceDomain } from "@jotster/notifications/Jotster.Notifications.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRegisterPushDevice = async (
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

  const token = getOptionalStringField(body, "token");
  if (!token) {
    res.status(400).json({ result: "error", msg: "Missing required field: token" });
    return;
  }

  const kind = getOptionalStringField(body, "kind");
  if (!kind) {
    res.status(400).json({ result: "error", msg: "Missing required field: kind" });
    return;
  }

  const iosAppId = getOptionalStringField(body, "ios_app_id");

  const result = await registerDeviceDomain(app.options, user, kind, token, iosAppId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
