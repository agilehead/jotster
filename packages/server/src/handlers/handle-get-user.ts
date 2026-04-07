import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUserByIdDomain } from "@jotster/users/Jotster.Users.js";
import { resolveUserByEmailPath } from "../helpers/compat-db.ts";
import { buildUserResponse } from "../helpers/map-user-to-response.ts";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetUser = async (
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
  const identifier =
    (req.param("user_id_or_email") ?? req.param("user_id") ?? "");

  const resolvedByEmail = await resolveUserByEmailPath(
    app.options,
    user.tenantId,
    identifier,
  );
  if (resolvedByEmail !== undefined) {
    res.json({
      result: "success",
      msg: "",
      user: await buildUserResponse(app.options, resolvedByEmail),
    });
    return;
  }

  const parsedUserId = parseId(identifier);
  if (parsedUserId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "User not found", code: "BAD_REQUEST" });
    return;
  }

  const result = await getUserByIdDomain(
    app.options,
    user.tenantId,
    toLong(parsedUserId),
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const payload: Record<string, JsValue> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["user"] = await buildUserResponse(app.options, result.data);
  res.json(payload);
};
