import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
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

  const status = body["status"] as string;
  const client = body["client"] as string;
  const pingOnly = body["ping_only"] === "true" || body["ping_only"] === true;
  const input = { status, client, pingOnly };

  const result = await updatePresenceDomain(app.options, user, input);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", presences: data.presences, server_timestamp: data.serverTimestamp });
};
