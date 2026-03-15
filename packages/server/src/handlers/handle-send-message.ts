import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { sendMessageDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSendMessage = async (
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

  const type = getOptionalStringField(body, "type");
  const to = getOptionalStringField(body, "to");
  const topic = getOptionalStringField(body, "topic");
  const content = getOptionalStringField(body, "content");
  if (type === undefined || to === undefined || content === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required message fields" });
    return;
  }

  const result = await sendMessageDomain(app.options, user, {
    type,
    to,
    topic,
    content,
  });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({ result: "success", msg: "", id: data.id });
};
