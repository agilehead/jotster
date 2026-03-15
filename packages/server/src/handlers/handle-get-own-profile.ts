import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getOwnProfile } from "@jotster/users/Jotster.Users.js";
import { buildUserResponse } from "../helpers/map-user-to-response.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetOwnProfile = async (
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
  const result = await getOwnProfile(app.options, user);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const payload = await buildUserResponse(app.options, result.data);
  payload["result"] = "success";
  payload["msg"] = "";
  res.json(payload);
};
