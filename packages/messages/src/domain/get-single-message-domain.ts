import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getMessage } from "../repo/get-message.ts";
import { getReactionsForMessage } from "../repo/get-reactions-for-message.ts";

export const getSingleMessageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: long,
): Promise<Result<Record<string, JsValue>, string>> => {
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  // Load reactions
  const reactions = await getReactionsForMessage(
    options,
    user.tenantId,
    message.Id,
  );
  const reactionList = new List<Record<string, JsValue>>();
  for (let i = 0; i < reactions.length; i++) {
    const r = reactions[i];
    const reactionObj: Record<string, JsValue> = {};
    reactionObj["emoji_name"] = r.EmojiName;
    reactionObj["emoji_code"] = r.EmojiCode;
    reactionObj["reaction_type"] = r.ReactionType;
    reactionObj["user_id"] = r.UserId;
    reactionList.Add(reactionObj);
  }

  const formatted: Record<string, JsValue> = {};
  formatted["id"] = message.Id;
  formatted["sender_id"] = message.SenderId;
  formatted["type"] = message.Type === "stream" ? "stream" : "direct";
  formatted["content"] = message.RenderedContent;
  formatted["content_raw"] = message.Content;
  formatted["subject"] = message.Topic ?? "";
  formatted["timestamp"] = Convert.ToDouble(message.CreatedAt) / 1000;
  if (message.ChannelId !== undefined) {
    formatted["stream_id"] = message.ChannelId;
  }
  if (message.DmGroupId !== undefined) {
    formatted["dm_group_id"] = message.DmGroupId;
  }
  formatted["reactions"] = reactionList.ToArray();

  if (message.Type === "stream" && message.ChannelId !== undefined) {
    formatted["display_recipient"] = message.ChannelId;
  } else if (message.DmGroupId !== undefined) {
    formatted["display_recipient"] = message.DmGroupId;
  }

  return ok(formatted);
};
