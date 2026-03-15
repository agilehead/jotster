import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { addUserGroupMembersDomain } from "@jotster/permissions/Jotster.Permissions.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong, toLongArray } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleAddUserGroupMembers = async (
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
  const groupId = parseId(req.params["group_id"] as string);
  if (groupId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid group_id" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const addIds = toLongArray(body["add"] as string[] | undefined);

  if (addIds === undefined || addIds.length === 0) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: add" });
    return;
  }

  const result = await addUserGroupMembersDomain(
    app.options,
    user,
    toLong(groupId),
    addIds,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
