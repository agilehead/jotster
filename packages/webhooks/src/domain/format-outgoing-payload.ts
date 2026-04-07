import type { int, JsValue, long } from "@tsonic/core/types.js";

interface MessageData {
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
  botUserId: long;
  token: string;
}

export const formatOutgoingPayload = (
  data: MessageData,
  interfaceType: int,
): Record<string, JsValue> => {
  const payload: Record<string, JsValue> = {};

  if (interfaceType === (1 as int)) {
    // Zulip format
    payload["bot_email"] = data.senderEmail;
    payload["bot_full_name"] = data.senderFullName;
    payload["data"] = data.content;
    payload["token"] = data.token;
    payload["trigger"] = data.type === "stream" ? "stream" : "direct_message";

    const message: Record<string, JsValue> = {};
    message["id"] = data.messageId;
    message["sender_id"] = data.senderId;
    message["sender_email"] = data.senderEmail;
    message["sender_full_name"] = data.senderFullName;
    message["type"] = data.type;
    message["content"] = data.content;
    message["timestamp"] = data.timestamp;

    if (data.type === "stream") {
      if (data.channelId !== undefined) {
        message["stream_id"] = data.channelId;
      }
      if (data.channelName !== undefined) {
        message["display_recipient"] = data.channelName;
      }
      if (data.topic !== undefined) {
        message["subject"] = data.topic;
      }
    }

    payload["message"] = message;
  } else {
    // Slack-compatible format (interfaceType === 2)
    payload["token"] = data.token;
    payload["team_id"] = "";
    payload["channel_id"] = data.channelId !== undefined ? data.channelId : "";
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
