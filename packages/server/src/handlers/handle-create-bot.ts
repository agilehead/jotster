import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createBotDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateBot = async (
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
  const fullName = req.body["full_name"] as string | undefined;
  const shortName = req.body["short_name"] as string | undefined;
  const botType = req.body["bot_type"] as number | undefined;

  if (!fullName || !shortName) {
    res.status(400).json({ result: "error", msg: "Missing required fields: full_name, short_name" });
    return;
  }

  const result = await createBotDomain(app.options, user, { fullName, shortName, botType });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", user_id: result.data.userId, api_key: result.data.apiKey });
};
