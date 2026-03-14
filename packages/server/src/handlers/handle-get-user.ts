import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserByIdDomain } from "@jotster/users/Jotster.Users.js";
import { resolveUserByEmailPath } from "../helpers/compat-db.ts";
import { mapUserToResponse } from "../helpers/map-user-to-response.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetUser = async (
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

  const resolvedByEmail = await resolveUserByEmailPath(app.options, user.tenantId, identifier);
  if (resolvedByEmail !== undefined) {
    res.json({ result: "success", msg: "", user: mapUserToResponse(resolvedByEmail) });
    return;
  }

  const result = await getUserByIdDomain(app.options, user.tenantId, identifier);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const payload: Record<string, unknown> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["user"] = mapUserToResponse(result.data);
  res.json(payload);
};
