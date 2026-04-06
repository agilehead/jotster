import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateProfileDataDomain } from "@jotster/users/Jotster.Users.js";
import type { ProfileDataUpdate } from "@jotster/users/Jotster.Users.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getBodyObject } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

const parseProfileDataUpdate = (
  value: JsValue,
): ProfileDataUpdate | undefined => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, JsValue>;
  const result: ProfileDataUpdate = {};
  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (
      entryValue === null ||
      typeof entryValue !== "object" ||
      Array.isArray(entryValue)
    ) {
      return undefined;
    }

    const valueRecord = entryValue as Record<string, JsValue>;
    const rawValue = valueRecord["value"];
    if (typeof rawValue !== "string") {
      return undefined;
    }

    result[entryKey] = { value: rawValue };
  }

  return result;
};

export const handleUpdateProfileData = async (
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
  const body = getBodyObject(req);
  const profileData = parseProfileDataUpdate(body["profile_data"]);

  if (!profileData) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: profile_data" });
    return;
  }

  const pdKeys = Object.keys(profileData);
  const profileDataKeys = new List<string>();
  for (let i = 0; i < pdKeys.length; i++) {
    profileDataKeys.Add(pdKeys[i]);
  }

  const result = await updateProfileDataDomain(
    app.options,
    user,
    profileData,
    profileDataKeys,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
