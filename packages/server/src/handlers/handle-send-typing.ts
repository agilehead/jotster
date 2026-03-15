import type { long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalStringArrayField,
  getOptionalStringField,
  toLong,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { sendTypingDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

const parseIdArray = (values: string[] | undefined): long[] | undefined => {
  if (values === undefined) {
    return undefined;
  }
  const result: long[] = [];
  for (let i = 0; i < values.length; i++) {
    const parsed = parseId(values[i]);
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};

export const handleSendTyping = async (
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

  const op = getOptionalStringField(body, "op");
  if (op === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: op" });
    return;
  }
  const type = getOptionalStringField(body, "type");
  const parsedTo = parseIdArray(getOptionalStringArrayField(body, "to"));
  const streamId = parseId(getOptionalStringField(body, "stream_id"));
  const topic = getOptionalStringField(body, "topic");

  const result = await sendTypingDomain(app.options, user, {
    op,
    type,
    to: parsedTo,
    streamId,
    topic,
  });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
