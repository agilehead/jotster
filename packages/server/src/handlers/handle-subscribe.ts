import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { getBodyObject, toOptionalFlagInt, toOptionalInt } from "../helpers/body.ts";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { subscribeDomain } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleSubscribe = async (
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

  const subscriptionsRaw = body["subscriptions"] as string;
  if (!subscriptionsRaw) {
    res.status(400).json({ result: "error", msg: "Missing required field: subscriptions" });
    return;
  }

  const subscriptions = JSON.parse(subscriptionsRaw) as { name: string; description?: string }[];

  const principalsRaw = body["principals"] as string | undefined;
  const principals = principalsRaw ? JSON.parse(principalsRaw) as string[] : undefined;

  const inviteOnly = toOptionalFlagInt(body["invite_only"]);
  const isWebPublic = toOptionalFlagInt(body["is_web_public"]);
  const historyPublicToSubscribers = toOptionalFlagInt(body["history_public_to_subscribers"]);
  const messageRetentionDays = toOptionalInt(body["message_retention_days"]);

  const createParams: {
    isPrivate?: int;
    isWebPublic?: int;
    historyPublicToSubscribers?: int;
    messageRetentionDays?: int;
  } = {
    isPrivate: inviteOnly,
    isWebPublic,
    historyPublicToSubscribers,
    messageRetentionDays,
  };

  const mergedSubscribed: Record<string, string[]> = {};
  const mergedAlreadySubscribed: Record<string, string[]> = {};

  for (let i = 0; i < subscriptions.length; i++) {
    const entry = subscriptions[i];
    const result = await subscribeDomain(app.options, user, entry.name, principals, createParams);
    if (!result.success) {
      res.status(400).json({ result: "error", msg: result.error });
      return;
    }

    const subscribed = result.data.subscribed as Record<string, string[]>;
    const alreadySubscribed = result.data.alreadySubscribed as Record<string, string[]>;

    const subscribedKeys = Object.keys(subscribed);
    for (let j = 0; j < subscribedKeys.length; j++) {
      const key = subscribedKeys[j];
      if (!mergedSubscribed[key]) {
        mergedSubscribed[key] = [];
      }
      const values = subscribed[key];
      const mergedSubList = new List<string>();
      for (let mi = 0; mi < mergedSubscribed[key].length; mi++) {
        mergedSubList.Add(mergedSubscribed[key][mi]);
      }
      for (let k = 0; k < values.length; k++) {
        mergedSubList.Add(values[k]);
      }
      mergedSubscribed[key] = mergedSubList.ToArray();
    }

    const alreadyKeys = Object.keys(alreadySubscribed);
    for (let j = 0; j < alreadyKeys.length; j++) {
      const key = alreadyKeys[j];
      if (!mergedAlreadySubscribed[key]) {
        mergedAlreadySubscribed[key] = [];
      }
      const values = alreadySubscribed[key];
      const mergedAlreadyList = new List<string>();
      for (let mi = 0; mi < mergedAlreadySubscribed[key].length; mi++) {
        mergedAlreadyList.Add(mergedAlreadySubscribed[key][mi]);
      }
      for (let k = 0; k < values.length; k++) {
        mergedAlreadyList.Add(values[k]);
      }
      mergedAlreadySubscribed[key] = mergedAlreadyList.ToArray();
    }
  }

  res.json({
    result: "success",
    msg: "",
    subscribed: mergedSubscribed,
    already_subscribed: mergedAlreadySubscribed,
  });
};
