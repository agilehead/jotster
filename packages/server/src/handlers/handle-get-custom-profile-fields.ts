import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getCustomProfileFieldsDomain } from "@jotster/users/Jotster.Users.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetCustomProfileFields = async (
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
  const result = await getCustomProfileFieldsDomain(app.options, user);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const payload: Record<string, JsValue> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["custom_fields"] = result.data;
  res.json(payload);
};
