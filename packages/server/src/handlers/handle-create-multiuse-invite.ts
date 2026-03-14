import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createMultiuseLinkDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalField, getOptionalStringArrayField, hasField, toOptionalInt } from "../helpers/body.ts";

export const handleCreateMultiuseInvite = async (
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

  const channelIds = getOptionalStringArrayField(body, "stream_ids") ?? [];

  const parsedInviteAsRole = toOptionalInt(getOptionalField(body, "invite_as"));
  if (hasField(body, "invite_as") && parsedInviteAsRole === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid invite_as" });
    return;
  }
  const inviteAsRole = parsedInviteAsRole ?? (400 as int);
  const input = {
    channelIds,
    inviteAsRole,
  };

  const result = await createMultiuseLinkDomain(app.options, user, input);

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", invite_link: result.data.link });
};
