import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toOptionalInt } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createBotDomain } from "@jotster/users/Jotster.Users.js";
import type { CreateBotDomainInput } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateBot = async (
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
  const body = getBodyObject(req);
  const fullName = body["full_name"] as string | undefined;
  const shortName = body["short_name"] as string | undefined;
  const botType = toOptionalInt(body["bot_type"]);

  if (!fullName || !shortName) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required fields: full_name, short_name",
      });
    return;
  }

  const input: CreateBotDomainInput = {
    fullName,
    shortName,
    botType,
  };
  const result = await createBotDomain(app.options, user, input);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    user_id: result.data.userId,
    api_key: result.data.apiKey,
  });
};
