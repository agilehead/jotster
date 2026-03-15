import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateProfileDataDomain } from "@jotster/users/Jotster.Users.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getBodyObject } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

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
  const profileData = body["profile_data"] as
    | Record<string, { value: string }>
    | undefined;

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
