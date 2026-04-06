import type { int, JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  OutgoingWebhook,
} from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getOutgoingWebhooksForChannel } from "../repo/get-outgoing-webhooks-for-channel.ts";
import { getMentionTriggeredWebhooks } from "../repo/get-mention-triggered-webhooks.ts";
import { formatOutgoingPayload } from "./format-outgoing-payload.ts";

interface TriggerOutgoingWebhooksInput {
  tenantId: long;
  messageId: long;
  senderId: long;
  senderEmail: string;
  senderFullName: string;
  type: string;
  channelId?: long;
  channelName?: string;
  topic?: string;
  content: string;
  timestamp: number;
  mentionedUserIds?: long[];
}

interface OutgoingWebhookDispatch {
  url: string;
  payload: Record<string, JsValue>;
}

export const triggerOutgoingWebhooksDomain = async (
  options: DbContextOptions,
  input: TriggerOutgoingWebhooksInput,
): Promise<OutgoingWebhookDispatch[]> => {
  const dispatches = new List<OutgoingWebhookDispatch>();

  // 1. Check for channel-triggered webhooks
  if (input.type === "stream" && input.channelId !== undefined) {
    const chId = input.channelId as long;
    const channelWebhooks = await getOutgoingWebhooksForChannel(
      options,
      input.tenantId,
      chId,
    );

    for (let i = 0; i < channelWebhooks.length; i++) {
      const webhook = channelWebhooks[i];
      const payload = formatOutgoingPayload(
        {
          messageId: input.messageId,
          senderId: input.senderId,
          senderEmail: input.senderEmail,
          senderFullName: input.senderFullName,
          type: input.type,
          channelId: chId,
          channelName: input.channelName,
          topic: input.topic,
          content: input.content,
          timestamp: input.timestamp,
          botUserId: webhook.BotUserId,
          token: webhook.Token,
        },
        webhook.InterfaceType,
      );

      dispatches.Add({ url: webhook.Url, payload });
    }
  }

  // 2. Check for mention-triggered webhooks
  if (
    input.mentionedUserIds !== undefined &&
    input.mentionedUserIds.length > 0
  ) {
    const mentionWebhooks = await getMentionTriggeredWebhooks(
      options,
      input.tenantId,
    );

    for (let i = 0; i < mentionWebhooks.length; i++) {
      const webhook = mentionWebhooks[i];
      // Check if the bot user for this webhook was mentioned
      let botMentioned = false;
      for (let j = 0; j < input.mentionedUserIds.length; j++) {
        if (input.mentionedUserIds[j] === webhook.BotUserId) {
          botMentioned = true;
          break;
        }
      }

      if (botMentioned) {
        // Also verify the bot user is type 3 (outgoing webhook bot)
        const db = new JotsterDbContext(options);
        try {
          const db0 = db;
          const botUserId0 = webhook.BotUserId;
          const tenantId0 = input.tenantId;
          const botUser = await db0.Users.Where((u) => u.TenantId === tenantId0)
            .Where((u) => u.Id === botUserId0)
            .FirstOrDefaultAsync();

          if (botUser !== undefined && botUser !== null) {
            const botType3 = 3 as int;
            if (botUser.BotType === botType3) {
              const payload = formatOutgoingPayload(
                {
                  messageId: input.messageId,
                  senderId: input.senderId,
                  senderEmail: input.senderEmail,
                  senderFullName: input.senderFullName,
                  type: input.type,
                  channelId: input.channelId,
                  channelName: input.channelName,
                  topic: input.topic,
                  content: input.content,
                  timestamp: input.timestamp,
                  botUserId: webhook.BotUserId,
                  token: webhook.Token,
                },
                webhook.InterfaceType,
              );

              dispatches.Add({ url: webhook.Url, payload });
            }
          }
        } finally {
          db.Dispose();
        }
      }
    }
  }

  // TODO: Actual HTTP dispatch to webhook URLs.
  // In Tsonic/.NET, this would use HttpClient to POST the payload to each URL.
  // For MVP, we return the dispatch list so callers can handle delivery.
  // Future implementation:
  // for (let i = 0; i < dispatches.length; i++) {
  //   const dispatch = dispatches[i];
  //   // Fire and forget POST to dispatch.url with dispatch.payload
  // }

  return dispatches.ToArray();
};
