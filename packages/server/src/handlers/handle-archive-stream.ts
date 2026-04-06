import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { archiveChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleArchiveStream = async (
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
  const streamId = parseId(req.param("stream_id") ?? "");
  if (streamId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid stream_id" });
    return;
  }

  const result = await archiveChannelDomain(
    app.options,
    user,
    toLong(streamId),
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
