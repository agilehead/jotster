import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { resolveTenant, devFetchApiKey } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";
import {
  getDevAuthAvailabilityError,
  getJsonErrorBody,
  getPasswordAuthErrorStatus,
  getTenantAuthErrorStatus,
  INVALID_EMAIL_MSG,
  isValidLoginEmail,
} from "./auth-contract.ts";

export const handleDevFetchApiKey = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const devAuthError = getDevAuthAvailabilityError(app.config);
  if (devAuthError !== undefined) {
    res.status(400).json(getJsonErrorBody(devAuthError));
    return;
  }

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
  const username =
    getOptionalStringField(body, "username") ??
    getOptionalStringField(body, "direct_email");
  if (!username) {
    res.status(400).json(getJsonErrorBody("Missing username"));
    return;
  }
  if (!isValidLoginEmail(username)) {
    res.status(400).json(getJsonErrorBody(INVALID_EMAIL_MSG));
    return;
  }

  const result = await devFetchApiKey(
    app.options,
    app.config,
    tenantResult.data.Id,
    username,
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
