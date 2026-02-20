import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createDraftsDomain } from "@jotster/drafts/Jotster.Drafts.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateDrafts = async (
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

  const drafts = req.body["drafts"] as { type: string; to: string; topic?: string; content: string }[];

  if (drafts === undefined || drafts === null) {
    res.status(400).json({ result: "error", msg: "Missing 'drafts' field" });
    return;
  }

  const inputs = new List<{ type: string; to: string; topic?: string; content: string }>();
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    inputs.Add({ type: d.type, to: d.to, topic: d.topic, content: d.content });
  }

  const result = await createDraftsDomain(app.options, user, inputs.ToArray());
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", ids: result.data });
};
