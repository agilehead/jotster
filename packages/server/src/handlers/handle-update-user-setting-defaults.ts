import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateUserSettingDefaultsDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject } from "../helpers/body.ts";
import { normalizeRealmUserSettingDefaultsUpdates } from "../helpers/realm-user-setting-defaults.ts";

export const handleUpdateUserSettingDefaults = async (
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
  if (user.role > 200) {
    res.status(400).json({ result: "error", msg: "Must be an organization administrator", code: "UNAUTHORIZED_PRINCIPAL" });
    return;
  }
  const body = getBodyObject(req);
  const normalized = normalizeRealmUserSettingDefaultsUpdates(body);

  if (normalized.error !== undefined) {
    res.status(400).json({ result: "error", msg: normalized.error, code: "BAD_REQUEST" });
    return;
  }

  if (Object.keys(normalized.updates).length === 0) {
    res.status(400).json({ result: "error", msg: "No settings provided" });
    return;
  }

  const result = await updateUserSettingDefaultsDomain(app.options, user, normalized.updates);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const response: Record<string, unknown> = { result: "success", msg: "" };
  if (normalized.ignoredParametersUnsupported.length > 0) {
    response["ignored_parameters_unsupported"] = normalized.ignoredParametersUnsupported;
  }
  res.json(response);
};
