import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
import { resolveTenant, fetchApiKey } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getJsonErrorBody,
  getPasswordAuthErrorStatus,
  getTenantAuthErrorStatus,
  INVALID_EMAIL_MSG,
  isValidLoginEmail,
} from "./auth-contract.ts";

export const handleFetchApiKey = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const tenantResult = await resolveTenant(
    app.options,
    app.config,
    req.get("host") ?? "",
  );
  if (!tenantResult.success) {
    res
      .status(getTenantAuthErrorStatus(tenantResult.error))
      .json(getJsonErrorBody(tenantResult.error));
    return;
  }

  const body = getBodyObject(req);
  const username = body["username"] as string | undefined;
  const password = body["password"] as string | undefined;
  if (!username || !password) {
    res.status(400).json(getJsonErrorBody("Missing username or password"));
    return;
  }
  if (!isValidLoginEmail(username)) {
    res.status(400).json(getJsonErrorBody(INVALID_EMAIL_MSG));
    return;
  }

  const result = await fetchApiKey(
    app.options,
    tenantResult.data.Id,
    username,
    password,
  );
  if (!result.success) {
    res
      .status(getPasswordAuthErrorStatus(result.error))
      .json(getJsonErrorBody(result.error));
    return;
  }

  res.json({
    result: "success",
    msg: "",
    api_key: result.data.api_key,
    email: result.data.email,
    user_id: result.data.user_id,
  });
};
