import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { revokeInvitationDomain } from "@jotster/organization/Jotster.Organization.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleRevokeMultiuseInvite = async (
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
  const inviteId = parseId(req.param("invite_id") ?? "");
  if (inviteId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid invite_id" });
    return;
  }

  const result = await revokeInvitationDomain(
    app.options,
    user,
    toLong(inviteId),
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
