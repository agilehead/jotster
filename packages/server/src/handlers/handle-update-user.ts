import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserDomain } from "@jotster/users/Jotster.Users.js";
import { getBodyObject, toOptionalInt, toLong} from "../helpers/body.ts";
import { resolveUserByEmailPath } from "../helpers/compat-db.ts";
import { parseId } from "@jotster/core/Jotster.Core.js";
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
  const identifier = req.params["user_id_or_email"] as string ?? req.params["user_id"] as string;
  const resolvedUser = await resolveUserByEmailPath(app.options, user.tenantId, identifier);
  const targetId = resolvedUser !== undefined ? resolvedUser.Id : parseId(identifier);
  if (targetId === undefined) {
    res.status(400).json({ result: "error", msg: "User not found", code: "BAD_REQUEST" });
    return;
  }

  const body = getBodyObject(req);
  const updates: { fullName?: string; role?: int } = {};
  if (body["full_name"] !== undefined) updates.fullName = body["full_name"] as string;
  if (body["role"] !== undefined) updates.role = toOptionalInt(body["role"]);

  const result = await updateUserDomain(app.options, user, toLong(targetId), updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
