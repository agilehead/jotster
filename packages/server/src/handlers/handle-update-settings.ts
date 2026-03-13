import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateSettingsDomain } from "@jotster/users/Jotster.Users.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getBodyObject } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateSettings = async (
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
  const updates = getBodyObject(req);
  const bodyKeys = Object.keys(updates);
  const updateKeys = new List<string>();
  for (let i = 0; i < bodyKeys.length; i++) {
    updateKeys.Add(bodyKeys[i]);
  }

  const result = await updateSettingsDomain(app.options, user, updates, updateKeys);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", ignored_parameters_unsupported: result.data });
};
