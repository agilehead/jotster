import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getUsers } from "@jotster/users/Jotster.Users.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { buildUserResponse } from "../helpers/map-user-to-response.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetUsers = async (
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
  const data = await getUsers(app.options, user.tenantId);

  const members = new List<Record<string, JsValue>>();
  for (let i = 0; i < data.length; i++) {
    members.Add(await buildUserResponse(app.options, data[i]));
  }

  const payload: Record<string, JsValue> = {};
  payload["result"] = "success";
  payload["msg"] = "";
  payload["members"] = members.ToArray();
  res.json(payload);
};
