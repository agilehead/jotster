import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getAttachmentsDomain } from "@jotster/uploads/Jotster.Uploads.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetAttachments = async (
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

  const result = await getAttachmentsDomain(app.options, user);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  const attachments: Record<string, unknown>[] = [];
  for (let i = 0; i < data.attachments.length; i++) {
    const item = data.attachments[i];
    const attachment: Record<string, unknown> = {};
    attachment["id"] = item.id;
    attachment["name"] = item.name;
    attachment["path_id"] = item.path_id;
    attachment["size"] = item.size;
    attachment["create_time"] = item.create_time;
    const messages: Record<string, unknown>[] = [];
    for (let j = 0; j < item.messages.length; j++) {
      const message: Record<string, unknown> = {};
      message["id"] = item.messages[j].id;
      messages.push(message);
    }
    attachment["messages"] = messages;
    attachments.push(attachment);
  }

  res.json({ result: "success", msg: "", attachments });
};
