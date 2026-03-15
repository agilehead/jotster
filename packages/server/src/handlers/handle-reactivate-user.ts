import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { reactivateUserDomain } from "@jotster/users/Jotster.Users.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleReactivateUser = async (
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
  const targetId = parseId(req.params["user_id"] as string);
  if (targetId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid user_id" });
    return;
  }

  const result = await reactivateUserDomain(app.options, user, toLong(targetId));
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
