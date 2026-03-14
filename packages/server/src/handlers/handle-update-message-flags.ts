import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalJsonArrayField, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateFlagsDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";

const toStringArray = (value: unknown[] | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const result: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry !== "string") {
      return undefined;
    }
    result.push(entry as string);
  }
  return result;
};

export const handleUpdateMessageFlags = async (
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

  const parsedMessages = toStringArray(getOptionalJsonArrayField(body, "messages"));
  const op = getOptionalStringField(body, "op");
  const flag = getOptionalStringField(body, "flag");
  if (parsedMessages === undefined || op === undefined || flag === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid message flags payload" });
    return;
  }

  const result = await updateFlagsDomain(app.options, user, { messages: parsedMessages, op, flag });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", messages: data.messages });
};
