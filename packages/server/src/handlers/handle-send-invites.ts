import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { sendInvitationsDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalField, getOptionalStringArrayField, getOptionalStringField, hasField, toOptionalInt } from "../helpers/body.ts";

export const handleSendInvites = async (
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
  const body = getBodyObject(req);

  let inviteeEmails = getOptionalStringArrayField(body, "invitee_emails");
  const inviteeEmail = getOptionalStringField(body, "invitee_emails");
  if (inviteeEmails === undefined && inviteeEmail !== undefined && inviteeEmail.trim().length > 0) {
    inviteeEmails = [inviteeEmail];
  }
  if (inviteeEmails === undefined || inviteeEmails.length === 0) {
    res.status(400).json({ result: "error", msg: "Missing invitee_emails" });
    return;
  }

  // Parse stream_ids (channel_ids) if provided
  const channelIds = getOptionalStringArrayField(body, "stream_ids") ?? [];

  const inviteAsValue = getOptionalField(body, "invite_as");
  const parsedInviteAsRole = toOptionalInt(inviteAsValue);
  if (hasField(body, "invite_as") && parsedInviteAsRole === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid invite_as" });
    return;
  }
  const inviteAsRole = parsedInviteAsRole ?? (400 as int);
  const input = {
    inviteeEmails,
    channelIds,
    inviteAsRole,
  };

  const result = await sendInvitationsDomain(app.options, user, input);

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
