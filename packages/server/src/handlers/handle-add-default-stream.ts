import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toLong } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { addDefaultChannelDomain } from "@jotster/channels/Jotster.Channels.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleAddDefaultStream = async (
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
  const body = getBodyObject(req);
  const streamId = parseId(`${body["stream_id"] ?? ""}`);

  if (streamId === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: stream_id" });
    return;
  }

  const result = await addDefaultChannelDomain(
    app.options,
    user,
    toLong(streamId),
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
