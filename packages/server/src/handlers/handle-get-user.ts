import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserByIdDomain } from "@jotster/users/Jotster.Users.js";
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
  const userId = req.params["user_id"] as string;

  const result = await getUserByIdDomain(app.options, user.tenantId, userId);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ user: mapUserToResponse(result.data) });
};
