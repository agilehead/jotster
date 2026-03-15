import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getInvitationById } from "@jotster/organization/Jotster.Organization.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleResendInvite = async (
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
  const inviteId = parseId(req.params["invite_id"] as string);
  if (inviteId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid invite_id" });
    return;
  }

  // Verify the invitation exists and belongs to this tenant
  const invitation = await getInvitationById(
    app.options,
    user.tenantId,
    toLong(inviteId),
  );
  if (invitation === undefined) {
    res.status(400).json({ result: "error", msg: "Invitation not found" });
    return;
  }

  // In a real implementation, this would trigger an email resend.
  // For now, we just confirm the invitation exists and is pending.
  if (invitation.Status !== "pending") {
    res.status(400).json({ result: "error", msg: "Invitation is not pending" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
