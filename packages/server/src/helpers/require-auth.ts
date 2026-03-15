import type { Request, Response } from "@tsonic/express/index.js";
import type { AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "./app-context.ts";

export const requireAuth = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<AuthenticatedUser | undefined> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return undefined;
  }

  return authResult.data;
};
