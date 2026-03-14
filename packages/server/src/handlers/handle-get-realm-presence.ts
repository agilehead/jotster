import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getRealmPresenceDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalBooleanField } from "../helpers/body.ts";

export const handleGetRealmPresence = async (
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
  const query = req.query as Record<string, unknown>;
  const slimPresence = getOptionalBooleanField(query, "slim_presence") ?? false;

  const result = await getRealmPresenceDomain(app.options, user, slimPresence);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", presences: data.presences, server_timestamp: data.serverTimestamp });
};
