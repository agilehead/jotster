import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getMessagesDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getOptionalStringField, toOptionalInt } from "../helpers/body.ts";

export const handleGetMessages = async (
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
  const query = req.query as Record<string, unknown>;
  const narrow = getOptionalStringField(query, "narrow");
  const anchor = getOptionalStringField(query, "anchor");
  const numBefore = getOptionalStringField(query, "num_before");
  const numAfter = getOptionalStringField(query, "num_after");
  const applyMarkdown = getOptionalStringField(query, "apply_markdown");
  const parsedNumBefore = numBefore === undefined ? undefined : toOptionalInt(numBefore);
  if (numBefore !== undefined && parsedNumBefore === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid num_before", code: "BAD_REQUEST" });
    return;
  }
  const parsedNumAfter = numAfter === undefined ? undefined : toOptionalInt(numAfter);
  if (numAfter !== undefined && parsedNumAfter === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid num_after", code: "BAD_REQUEST" });
    return;
  }

  const result = await getMessagesDomain(app.options, user, {
    narrow,
    anchor,
    numBefore: parsedNumBefore,
    numAfter: parsedNumAfter,
    applyMarkdown: applyMarkdown !== "false",
  });

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  const data = result.data;
  res.json({
    result: "success",
    msg: "",
    messages: data.messages,
    found_anchor: data.foundAnchor,
    found_newest: data.foundNewest,
    found_oldest: data.foundOldest,
  });
};
