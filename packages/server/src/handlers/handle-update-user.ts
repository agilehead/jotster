import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserDomain } from "@jotster/users/Jotster.Users.js";
import { getBodyObject, toOptionalInt } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateUser = async (
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
  const targetId = req.params["user_id"] as string;

  const body = getBodyObject(req);
  const updates: { fullName?: string; role?: int } = {};
  if (body["full_name"] !== undefined) updates.fullName = body["full_name"] as string;
  if (body["role"] !== undefined) updates.role = toOptionalInt(body["role"]);

  const result = await updateUserDomain(app.options, user, targetId, updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
