import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, getOptionalJsonArrayField, getOptionalStringField, toOptionalRecord, toOptionalStringArray } from "../helpers/body.ts";
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
  const body = getBodyObject(req);

  const drafts = getOptionalJsonArrayField(body, "drafts");

  if (drafts === undefined) {
    res.status(400).json({ result: "error", msg: "Missing 'drafts' field" });
    return;
  }

  const inputs = new List<{ type: string; to: string; topic?: string; content: string }>();
  for (let i = 0; i < drafts.length; i++) {
    const draft = toOptionalRecord(drafts[i]);
    if (draft === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid draft payload" });
      return;
    }

    const type = getOptionalStringField(draft, "type");
    const topic = getOptionalStringField(draft, "topic");
    const content = getOptionalStringField(draft, "content");
    const toString = getOptionalStringField(draft, "to");
    const toArray = toOptionalStringArray(draft["to"]);
    if (type === undefined || content === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid draft payload" });
      return;
    }

    const to = type === "stream" ? (toString ?? toArray?.[0]) : (toString ?? (toArray !== undefined ? JSON.stringify(toArray) : undefined));
    if (to === undefined) {
      res.status(400).json({ result: "error", msg: "Invalid draft payload" });
      return;
    }

    inputs.Add({ type, to, topic, content });
  }

  const result = await createDraftsDomain(
    app.options,
    user,
    inputs.ToArray()
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", ids: result.data });
};
