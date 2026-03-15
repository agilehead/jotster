import type { Request, Response } from "@tsonic/express/index.js";
import {
  authenticateRequest,
  regenerateApiKey,
} from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRegenerateApiKey = async (
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
  const result = await regenerateApiKey(
    app.options,
    user.tenantId,
    user.userId,
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    api_key: result.data.api_key,
  });
};
