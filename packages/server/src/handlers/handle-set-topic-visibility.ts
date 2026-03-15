import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toLong} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { setTopicVisibilityDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";
import { toOptionalInt } from "../helpers/body.ts";

export const handleSetTopicVisibility = async (
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

  const streamId = parseId(`${body["stream_id"] ?? ""}`);
  const topic = body["topic"] as string;
  const visibilityPolicy = toOptionalInt(body["visibility_policy"]);
  if (visibilityPolicy === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid visibility_policy" });
    return;
  }

  const result = await setTopicVisibilityDomain(app.options, user, {
    channelId: toLong(streamId),
    topic,
    visibilityPolicy,
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
