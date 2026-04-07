import type { JsValue, long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalJsonArrayField,
  getOptionalStringField,
  toLong,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { updateFlagsDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";

const toLongArray = (value: JsValue[] | undefined): long[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const result: long[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    const parsed = parseId(String(entry));
    if (parsed === undefined) {
      return undefined;
    }
    result.push(toLong(parsed));
  }
  return result;
};

export const handleUpdateMessageFlags = async (
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

  const parsedMessages = toLongArray(
    getOptionalJsonArrayField(body, "messages"),
  );
  const op = getOptionalStringField(body, "op");
  const flag = getOptionalStringField(body, "flag");
  if (parsedMessages === undefined || op === undefined || flag === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Invalid message flags payload" });
    return;
  }

  const result = await updateFlagsDomain(app.options, user, {
    messages: parsedMessages,
    op,
    flag,
  });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", messages: data.messages });
};
