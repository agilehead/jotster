import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalBooleanField, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updatePresenceDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdatePresence = async (
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

  const status = getOptionalStringField(body, "status");
  const client = getOptionalStringField(body, "client");
  if (status === undefined || client === undefined) {
    res.status(400).json({ result: "error", msg: "Missing required fields: status, client" });
    return;
  }
  const pingOnly = getOptionalBooleanField(body, "ping_only") ?? false;
  const input = { status, client, pingOnly };

  const result = await updatePresenceDomain(app.options, user, input);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", presences: data.presences, server_timestamp: data.serverTimestamp });
};
