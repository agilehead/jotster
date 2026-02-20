import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { addUserGroupMembersDomain } from "@jotster/permissions/Jotster.Permissions.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleAddUserGroupMembers = async (
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
  const groupId = req.params["group_id"] as string;

  const body = req.body as Record<string, unknown>;
  const add = body["add"] as string[] | undefined;

  if (!add || add.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing required field: add" });
    return;
  }

  const result = await addUserGroupMembersDomain(app.options, user, groupId, add);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
