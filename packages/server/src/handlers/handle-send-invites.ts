import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { sendInvitationsDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

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
  const body = req.body as Record<string, unknown>;

  const inviteeEmailsRaw = body["invitee_emails"] as string;
  if (!inviteeEmailsRaw) {
    res.status(400).json({ result: "error", msg: "Missing invitee_emails" });
    return;
  }

  // Parse invitee_emails - it's a JSON string array
  let inviteeEmails: string[];
  try {
    inviteeEmails = JSON.parse(inviteeEmailsRaw) as string[];
  } catch {
    res.status(400).json({ result: "error", msg: "Invalid invitee_emails format" });
    return;
  }

  // Parse stream_ids (channel_ids) if provided
  let channelIds: string[] = [];
  const streamIdsRaw = body["stream_ids"] as string;
  if (streamIdsRaw) {
    try {
      channelIds = JSON.parse(streamIdsRaw) as string[];
    } catch {
      // Ignore parse errors, use empty array
    }
  }

  const inviteAsRole = (body["invite_as"] !== undefined ? Number(body["invite_as"]) : 400) as int;

  const result = await sendInvitationsDomain(app.options, user, {
    inviteeEmails,
    channelIds,
    inviteAsRole,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
