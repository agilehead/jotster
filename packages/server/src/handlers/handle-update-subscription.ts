import type { Request, Response } from "@tsonic/express/index.js";
import {
  getBodyObject,
  getOptionalStringField,
  toLong,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updateSingleSubscriptionDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";

const hasOwnField = (source: Record<string, unknown>, key: string): boolean => {
  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === key) {
      return true;
    }
  }
  return false;
};

const getObjectField = (
  source: Record<string, unknown>,
  key: string,
): unknown => {
  const entries = Object.entries(source);
  for (let i = 0; i < entries.length; i++) {
    const [entryKey, entryValue] = entries[i];
    if (entryKey === key) {
      return entryValue;
    }
  }
  return undefined;
};

export const handleUpdateSubscription = async (
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
  const streamId = parseId(req.params["stream_id"] as string);
  if (streamId === undefined) {
    res.status(400).json({ result: "error", msg: "Invalid stream_id" });
    return;
  }

  const property = getOptionalStringField(body, "property");
  const value = getObjectField(body, "value");

  if (!property) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required field: property",
        code: "BAD_REQUEST",
      });
    return;
  }

  if (!hasOwnField(body, "value")) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required field: value",
        code: "BAD_REQUEST",
      });
    return;
  }

  const result = await updateSingleSubscriptionDomain(
    app.options,
    user,
    toLong(streamId),
    property,
    value,
  );
  if (!result.success) {
    res
      .status(400)
      .json({ result: "error", msg: result.error, code: "BAD_REQUEST" });
    return;
  }

  res.json({ result: "success", msg: "" });
};
