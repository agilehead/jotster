import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import {
  JotsterDbContext,
  ok,
  err,
  MAX_MESSAGE_LENGTH,
  MAX_TOPIC_LENGTH,
} from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { sendMessage } from "../repo/send-message.ts";
import { findOrCreateDmGroup } from "../repo/find-or-create-dm-group.ts";
import { renderMarkdownDomain } from "./render-markdown-domain.ts";

interface SendMessageDomainInput {
  type: string;
  to: string;
  topic?: string;
  content: string;
}

export const sendMessageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: SendMessageDomainInput
): Promise<Result<{ id: string }, string>> => {
  // Validate content
  const content = params.content.Trim();
  if (content.Length === 0) {
    return err("Message must not be empty");
  }

  if (content.Length > MAX_MESSAGE_LENGTH) {
    return err("Message too long");
  }

  // Render markdown
  const renderResult = renderMarkdownDomain(content);
  if (!renderResult.success) {
    return err(renderResult.error);
  }
  const renderedContent = renderResult.data.rendered;

  if (params.type === "stream") {
    // Resolve channel by name or ID
    const to = params.to.Trim();
    if (to.Length === 0) {
      return err("Channel must be specified");
    }

    // Validate topic
    const topic = params.topic !== undefined ? params.topic.Trim() : "";
    if (topic.Length === 0) {
      return err("Topic must not be empty for channel messages");
    }
    if (topic.Length > MAX_TOPIC_LENGTH) {
      return err("Topic too long");
    }

    // Try to resolve the channel: first try as ID, then as name
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;
      const to0 = to;

      // Try to find by ID first
      let channel = await db0.Channels
        .Where((c) => c.TenantId === tenantId0).Where((c) => c.Id === to0)
        .FirstOrDefaultAsync();

      // If not found by ID, try by name
      if (channel === undefined || channel === null) {
        channel = await db0.Channels
          .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === to0)
          .FirstOrDefaultAsync();
      }

      if (channel === undefined || channel === null) {
        return err("Channel not found");
      }

      const one = 1 as int;
      if (channel.IsArchived === one) {
        return err("Channel is archived");
      }

      // Verify user is subscribed to the channel
      const userId0 = user.userId;
      const channelId0 = channel.Id;
      const subscription = await db0.Subscriptions
        .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0).Where((s) => s.ChannelId === channelId0)
        .FirstOrDefaultAsync();

      if (subscription === undefined || subscription === null) {
        return err("Not subscribed to this channel");
      }

      // Send the message
      const message = await sendMessage(options, {
        tenantId: user.tenantId,
        senderId: user.userId,
        type: "stream",
        channelId: channel.Id,
        topic,
        content,
        renderedContent,
      });

      // Dispatch event
      dispatchEventToTenant(user.tenantId, {
        type: "message",
        data: {
          id: message.Id,
          sender_id: user.userId,
          type: "stream",
          stream_id: channel.Id,
          subject: topic,
          content: renderedContent,
          timestamp: Number(message.CreatedAt) / 1000,
        },
      });

      return ok({ id: message.Id });
    } finally {
      db.Dispose();
    }
  }

  if (params.type === "direct" || params.type === "private") {
    // Parse `to` as JSON array of user IDs/emails
    let userIds: string[];
    try {
      userIds = JSON.parse(params.to) as string[];
    } catch (_e) {
      return err("Invalid 'to' parameter: expected JSON array of user IDs");
    }

    if (userIds.length === 0) {
      return err("Recipient list must not be empty");
    }

    // Ensure the sender is included in the DM group
    let senderIncluded = false;
    for (let i = 0; i < userIds.length; i++) {
      if (userIds[i] === user.userId) {
        senderIncluded = true;
        break;
      }
    }
    if (!senderIncluded) {
      const userIdsList = new List<string>();
      for (let ui = 0; ui < userIds.length; ui++) {
        userIdsList.Add(userIds[ui]);
      }
      userIdsList.Add(user.userId);
      userIds = userIdsList.ToArray();
    }

    // Resolve email addresses to user IDs if needed
    const resolvedIds = new List<string>();
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;

      for (let i = 0; i < userIds.length; i++) {
        const candidate = userIds[i];
        // If it contains @ it's an email, resolve to userId
        if (candidate.Contains("@")) {
          const email0 = candidate;
          const u = await db0.Users
            .Where((usr) => usr.TenantId === tenantId0).Where((usr) => usr.Email === email0)
            .FirstOrDefaultAsync();
          if (u === undefined || u === null) {
            return err("User not found: " + candidate);
          }
          resolvedIds.Add(u.Id);
        } else {
          resolvedIds.Add(candidate);
        }
      }
    } finally {
      db.Dispose();
    }

    // Find or create DM group
    const dmGroup = await findOrCreateDmGroup(options, user.tenantId, resolvedIds.ToArray());

    // Send the message
    const message = await sendMessage(options, {
      tenantId: user.tenantId,
      senderId: user.userId,
      type: "direct",
      dmGroupId: dmGroup.Id,
      content,
      renderedContent,
    });

    // Dispatch event
    dispatchEventToTenant(user.tenantId, {
      type: "message",
      data: {
        id: message.Id,
        sender_id: user.userId,
        type: "direct",
        dm_group_id: dmGroup.Id,
        content: renderedContent,
        timestamp: Number(message.CreatedAt) / 1000,
      },
    });

    return ok({ id: message.Id });
  }

  return err("Invalid message type: " + params.type);
};
