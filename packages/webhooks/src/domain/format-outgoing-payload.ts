import type { int } from "@tsonic/core/types.js";

interface MessageData {
  messageId: string;
  senderId: string;
  senderEmail: string;
  senderFullName: string;
  type: string;
  channelId?: string;
  channelName?: string;
  topic?: string;
  content: string;
  timestamp: number;
  botUserId: string;
  token: string;
}

export const formatOutgoingPayload = (
  data: MessageData,
  interfaceType: int
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (interfaceType === (1 as int)) {
    // Zulip format
    payload["bot_email"] = data.senderEmail;
    payload["bot_full_name"] = data.senderFullName;
    payload["data"] = data.content;
    payload["token"] = data.token;
    payload["trigger"] = data.type === "stream" ? "stream" : "direct_message";

    const message: Record<string, unknown> = {};
    message["id"] = data.messageId;
    message["sender_id"] = data.senderId;
    message["sender_email"] = data.senderEmail;
    message["sender_full_name"] = data.senderFullName;
    message["type"] = data.type;
    message["content"] = data.content;
    message["timestamp"] = data.timestamp;

    if (data.type === "stream") {
      message["stream_id"] = data.channelId;
      message["display_recipient"] = data.channelName;
      message["subject"] = data.topic;
    }

    payload["message"] = message;
  } else {
    // Slack-compatible format (interfaceType === 2)
    payload["token"] = data.token;
    payload["team_id"] = "";
    payload["channel_id"] = data.channelId ?? "";
    payload["channel_name"] = data.channelName ?? "";
    payload["user_id"] = data.senderId;
    payload["user_name"] = data.senderFullName;
    payload["text"] = data.content;
    payload["timestamp"] = data.timestamp;

    if (data.topic !== undefined) {
      payload["topic"] = data.topic;
    }
  }

  return payload;
};
