import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject } from "../helpers/body.ts";
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

  const type = body["type"] as string | undefined;
  const to = body["to"] as string | undefined;
  const topic = body["topic"] as string | undefined;
  const content = body["content"] as string | undefined;

  const result = await updateDraftDomain(app.options, user, draftId, { type, to, topic, content });
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
