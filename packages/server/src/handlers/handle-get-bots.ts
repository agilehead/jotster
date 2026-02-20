import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getBotsDomain } from "@jotster/users/Jotster.Users.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetBots = async (
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
  const data = await getBotsDomain(app.options, user);

  const bots = new List<Record<string, unknown>>();
  for (let i = 0; i < data.Length; i++) {
    const b = data[i];
    const bot: Record<string, unknown> = {};
    bot["user_id"] = b.Id;
    bot["email"] = b.Email;
    bot["full_name"] = b.FullName;
    bot["bot_type"] = b.BotType ?? null;
    bot["is_active"] = b.IsActive === 1;
    bot["api_key"] = "";
    bot["default_sending_stream"] = null;
    bot["default_events_register_stream"] = null;
    bot["default_all_public_streams"] = false;
    bot["avatar_url"] = b.AvatarUrl ?? null;
    bot["owner_id"] = b.BotOwnerId ?? null;
    bot["services"] = [];
    bots.Add(bot);
  }

  res.json({ bots: bots.ToArray() });
};
