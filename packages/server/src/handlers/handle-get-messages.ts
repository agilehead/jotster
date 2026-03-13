import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getMessagesDomain } from "@jotster/messages/Jotster.Messages.js";
import type { AppContext } from "../helpers/app-context.ts";
import { toOptionalInt } from "../helpers/body.ts";

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

  const narrow = req.query["narrow"] as string | undefined;
  const anchor = req.query["anchor"] as string | undefined;
  const numBefore = req.query["num_before"] as string | undefined;
  const numAfter = req.query["num_after"] as string | undefined;
  const applyMarkdown = req.query["apply_markdown"] as string | undefined;
  const parsedNumBefore = numBefore === undefined ? undefined : toOptionalInt(numBefore);
  if (numBefore !== undefined && parsedNumBefore === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid num_before" });
    return;
  }
  const parsedNumAfter = numAfter === undefined ? undefined : toOptionalInt(numAfter);
  if (numAfter !== undefined && parsedNumAfter === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid num_after" });
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
    res.status(400).json({ result: "error", msg: result.error });
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
