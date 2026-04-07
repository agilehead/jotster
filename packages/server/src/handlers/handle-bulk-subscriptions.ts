import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  parseJsonValueText,
  toOptionalStringArray,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { bulkUpdateSubscriptionsDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import type { AppContext } from "../helpers/app-context.ts";

const parseBulkSubscriptionAddList = (
  value: string | undefined,
): { name: string; description?: string }[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = parseJsonValueText(value);
  if (!Array.isArray(parsed)) {
    return undefined;
  }

  const result: { name: string; description?: string }[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return undefined;
    }

    const record = item as Record<string, JsValue>;
    let name: string | undefined;
    let description: string | undefined;
    for (const [entryKey, entryValue] of Object.entries(record)) {
      if (entryKey === "name") {
        if (typeof entryValue !== "string") {
          return undefined;
        }
        name = entryValue;
        continue;
      }

      if (entryKey === "description") {
        if (entryValue !== undefined && typeof entryValue !== "string") {
          return undefined;
        }
        description = entryValue as string | undefined;
      }
    }

    if (name === undefined) {
      return undefined;
    }

    result.push({
      name,
      description,
    });
  }

  return result;
};

export const handleBulkSubscriptions = async (
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

  const addRaw = body["add"] as string | undefined;
  const deleteRaw = body["delete"] as string | undefined;

  const addList = parseBulkSubscriptionAddList(addRaw);
  const removeList = toOptionalStringArray(deleteRaw);

  const result = await bulkUpdateSubscriptionsDomain(
    app.options,
    user,
    addList,
    removeList,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({
    result: "success",
    msg: "",
    subscribed: result.data.subscribed,
    already_subscribed: result.data.alreadySubscribed,
    removed: result.data.removed,
    not_removed: result.data.notRemoved,
  });
};
