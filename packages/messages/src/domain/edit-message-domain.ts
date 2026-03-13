import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err, MAX_MESSAGE_LENGTH, MAX_TOPIC_LENGTH } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getMessage } from "../repo/get-message.ts";
import { updateMessage } from "../repo/update-message.ts";
import { createEditHistory } from "../repo/create-edit-history.ts";
import { renderMarkdownDomain } from "./render-markdown-domain.ts";

interface EditMessageDomainInput {
  content?: string;
  topic?: string;
  channelId?: string;
  propagateMode?: string;
}

export const editMessageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string,
  params: EditMessageDomainInput
): Promise<Result<void, string>> => {
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  // Permission check:
  // - Sender can edit their own content
  // - Admins (role <= 200) can edit any message
  // - Topic/channel moves need moderator+ (role <= 300)
  const isSender = message.SenderId === user.userId;
  const isAdmin = user.role <= 200;
  const isModerator = user.role <= 300;

  if (params.content !== undefined && !isSender && !isAdmin) {
    return err("You can only edit your own messages");
  }

  if (params.topic !== undefined && !isSender && !isModerator) {
    return err("Insufficient permission to move topic");
  }

  if (params.channelId !== undefined && !isModerator) {
    return err("Insufficient permission to move message to another channel");
  }

  // Validate content if changing
  let renderedContent: string | undefined = undefined;
  if (params.content !== undefined) {
    const content = params.content.trim();
    if (content.length === 0) {
      return err("Message content must not be empty");
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return err("Message too long");
    }

    const renderResult = renderMarkdownDomain(content);
    if (!renderResult.success) {
      return err(renderResult.error);
    }
    renderedContent = renderResult.data.rendered;
  }

  // Validate topic if changing
  if (params.topic !== undefined) {
    const topic = params.topic.trim();
    if (topic.length === 0) {
      return err("Topic must not be empty");
    }
    if (topic.length > MAX_TOPIC_LENGTH) {
      return err("Topic too long");
    }
  }

  // Save edit history
  if (params.content !== undefined) {
    await createEditHistory(options, {
      messageId,
      userId: user.userId,
      prevContent: message.Content,
      prevRenderedContent: message.RenderedContent,
    });
  }

  if (params.topic !== undefined) {
    await createEditHistory(options, {
      messageId,
      userId: user.userId,
      prevTopic: message.Topic,
    });
  }

  if (params.channelId !== undefined) {
    await createEditHistory(options, {
      messageId,
      userId: user.userId,
      prevChannelId: message.ChannelId,
    });
  }

  // Apply updates
  const updated = await updateMessage(options, user.tenantId, messageId, {
    content: params.content !== undefined ? params.content.trim() : undefined,
    renderedContent,
    topic: params.topic !== undefined ? params.topic.trim() : undefined,
    channelId: params.channelId,
  });

  if (updated === undefined) {
    return err("Failed to update message");
  }

  // Dispatch event
  const eventData: Record<string, unknown> = {};
  eventData["message_id"] = messageId;
  eventData["user_id"] = user.userId;
  if (params.content !== undefined) {
    eventData["content"] = params.content.trim();
    eventData["rendered_content"] = renderedContent;
    eventData["prev_content"] = message.Content;
    eventData["prev_rendered_content"] = message.RenderedContent;
  }
  if (params.topic !== undefined) {
    eventData["subject"] = params.topic.trim();
    eventData["prev_subject"] = message.Topic;
    eventData["propagate_mode"] = params.propagateMode ?? "change_one";
  }
  if (params.channelId !== undefined) {
    eventData["stream_id"] = params.channelId;
    eventData["prev_stream_id"] = message.ChannelId;
  }

  dispatchEventToTenant(user.tenantId, {
    type: "update_message",
    data: eventData,
  });

  return ok(undefined);
};
