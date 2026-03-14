import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalJsonObjectField, getOptionalStringField, toOptionalStringArray } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateDraftDomain } from "@jotster/drafts/Jotster.Drafts.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateDraft = async (
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
  const draftId = req.params["draft_id"] as string;
  const draft = getOptionalJsonObjectField(body, "draft") ?? body;

  const type = getOptionalStringField(draft, "type");
  const topic = getOptionalStringField(draft, "topic");
  const content = getOptionalStringField(draft, "content");
  const toString = getOptionalStringField(draft, "to");
  const toArray = toOptionalStringArray(draft["to"]);
  const to = type === "stream" ? (toString ?? toArray?.[0]) : (toString ?? (toArray !== undefined ? JSON.stringify(toArray) : undefined));

  const result = await updateDraftDomain(app.options, user, draftId, { type, to, topic, content });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
