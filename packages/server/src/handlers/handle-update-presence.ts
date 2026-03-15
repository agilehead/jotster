import type { Request, Response } from "@tsonic/express/index.js";
import type { int, long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import {
  getBodyObject,
  getOptionalBooleanField,
  getOptionalField,
  getOptionalIntField,
  getOptionalStringField,
} from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { updatePresenceDomain } from "@jotster/presence/Jotster.Presence.js";
import type { AppContext } from "../helpers/app-context.ts";

const parseOptionalLongField = (
  body: Record<string, unknown>,
  key: string,
): long | undefined => {
  const raw = getOptionalField(body, key);
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
      return undefined;
    }
    return Convert.ToInt64(raw);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return undefined;
    }
    return Convert.ToInt64(parsed);
  }

  return undefined;
};

export const handleUpdatePresence = async (
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

  const status = getOptionalStringField(body, "status");
  if (status === undefined) {
    res
      .status(400)
      .json({ result: "error", msg: "Missing required field: status" });
    return;
  }

  const input = {
    status,
    client: getOptionalStringField(body, "client"),
    pingOnly: getOptionalBooleanField(body, "ping_only") ?? false,
    slimPresence: getOptionalBooleanField(body, "slim_presence"),
    historyLimitDays: getOptionalIntField(body, "history_limit_days"),
    lastUpdateId: parseOptionalLongField(body, "last_update_id"),
  };

  const result = await updatePresenceDomain(app.options, user, input);
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  const payload: Record<string, unknown> = {
    result: "success",
    msg: "",
    presence_last_update_id: data.presenceLastUpdateId,
  };
  if (data.serverTimestamp !== undefined) {
    payload["server_timestamp"] = data.serverTimestamp;
  }
  if (data.presences !== undefined) {
    payload["presences"] = data.presences;
  }
  res.json(payload);
};
