import type { Request, Response } from "@tsonic/express/index.js";
import { fetchJwtApiKey, resolveTenant } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalBooleanField, getOptionalStringField } from "../helpers/body.ts";
import { listDevelopmentUsers } from "../helpers/compat-db.ts";
import { mapUserToResponse } from "../helpers/map-user-to-response.ts";

const buildRealmUrl = (req: Request): string => {
  const host = req.get("host") ?? "localhost";
  return `http://${host}`;
};

export const handleJwtFetchApiKey = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const tenantResult = await resolveTenant(app.options, app.config, req.get("host") ?? "");
  if (!tenantResult.success) {
    res.status(400).json({ result: "error", msg: tenantResult.error, code: "BAD_REQUEST" });
    return;
  }

  const body = getBodyObject(req);
  const token = getOptionalStringField(body, "token");
  const includeProfile = getOptionalBooleanField(body, "include_profile") === true;
  if (token === undefined || token.trim().length === 0) {
    res.status(400).json({ result: "error", msg: "Missing token", code: "BAD_REQUEST" });
    return;
  }

  const result = await fetchJwtApiKey(app.options, app.config, tenantResult.data.Id, token, includeProfile);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const payload: Record<string, unknown> = {
    result: "success",
    msg: "",
    api_key: result.data.api_key,
    email: result.data.email,
    user_id: result.data.user_id,
  };
  if (result.data.user !== undefined) {
    payload["user"] = mapUserToResponse(result.data.user);
  }
  res.json(payload);
};

export const handleDevListUsers = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const tenantResult = await resolveTenant(app.options, app.config, req.get("host") ?? "");
  if (!tenantResult.success) {
    res.status(400).json({ result: "error", msg: tenantResult.error, code: "BAD_REQUEST" });
    return;
  }

  const users = await listDevelopmentUsers(
    app.options,
    tenantResult.data.Id,
    buildRealmUrl(req),
  );

  res.json({
    result: "success",
    msg: "",
    direct_admins: users.direct_admins,
    direct_users: users.direct_users,
  });
};
