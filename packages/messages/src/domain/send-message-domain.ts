import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import {
  JotsterDbContext,
  Channel,
  ok,
  err,
  MAX_MESSAGE_LENGTH,
  MAX_TOPIC_LENGTH,
} from "@jotster/core/Jotster.Core.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { JsonSerializer } from "@tsonic/dotnet/System.Text.Json.js";
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
): Promise<Result<{ id: long }, string>> => {
  // Validate content
  const content = params.content.trim();
  if (content.length === 0) {
    return err("Message must not be empty");
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
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
    const to = params.to.trim();
    if (to.length === 0) {
      return err("Channel must be specified");
    }

    // Validate topic
    const topic = params.topic !== undefined ? params.topic.trim() : "";
    if (topic.length === 0) {
      return err("Topic must not be empty for channel messages");
    }
    if (topic.length > MAX_TOPIC_LENGTH) {
      return err("Topic too long");
    }

    // Try to resolve the channel: first try as ID, then as name
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;

      // Try to find by ID first
      const parsedId = parseInt(to, 10);
      let channel: Channel = undefined!;
      let channelFound = false;

      if (!isNaN(parsedId)) {
        const toLong = Convert.ToInt64(parsedId) as long;
        const found = await db0.Channels
          .Where((c) => c.TenantId === tenantId0).Where((c) => c.Id === toLong)
          .FirstOrDefaultAsync();
        if (found !== undefined && found !== null) {
          channel = found;
          channelFound = true;
        }
      }

      // If not found by ID, try by name
      if (!channelFound) {
        const to0 = to;
        const found = await db0.Channels
          .Where((c) => c.TenantId === tenantId0).Where((c) => c.Name === to0)
          .FirstOrDefaultAsync();
        if (found !== undefined && found !== null) {
          channel = found;
          channelFound = true;
        }
      }

      if (!channelFound) {
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
      const eventData: Record<string, unknown> = {};
      eventData["id"] = message.Id;
      eventData["sender_id"] = user.userId;
      eventData["type"] = "stream";
      eventData["stream_id"] = channel.Id;
      eventData["subject"] = topic;
      eventData["content"] = renderedContent;
      eventData["timestamp"] = Convert.ToDouble(message.CreatedAt) / 1000;
      dispatchEventToTenant(user.tenantId, {
        type: "message",
        data: eventData,
      });

      return ok({ id: message.Id });
    } finally {
      db.Dispose();
    }
  }

  if (params.type === "direct" || params.type === "private") {
    // Parse `to` as JSON array of user IDs/emails
    const parsedTo = JsonSerializer.Deserialize<string[]>(params.to);
    if (parsedTo === undefined) {
      return err("Invalid 'to' parameter: expected JSON array of user IDs");
    }
    const userIdStrs: string[] = parsedTo;

    if (userIdStrs.length === 0) {
      return err("Recipient list must not be empty");
    }

    // Resolve email addresses to user IDs and convert to long
    const resolvedIds = new List<long>();
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;

      for (let i = 0; i < userIdStrs.length; i++) {
        const candidate = userIdStrs[i];
        // If it contains @ it's an email, resolve to userId
        if (candidate.includes("@")) {
          const email0 = candidate;
          const u = await db0.Users
            .Where((usr) => usr.TenantId === tenantId0).Where((usr) => usr.Email === email0)
            .FirstOrDefaultAsync();
          if (u === undefined || u === null) {
            return err("User not found: " + candidate);
          }
          resolvedIds.Add(u.Id);
        } else {
          resolvedIds.Add(Convert.ToInt64(parseInt(candidate, 10)) as long);
        }
      }
    } finally {
      db.Dispose();
    }

    // Ensure the sender is included in the DM group
    let senderIncluded = false;
    for (let i = 0; i < resolvedIds.Count; i++) {
      if (resolvedIds[i] === user.userId) {
        senderIncluded = true;
        break;
      }
    }
    if (!senderIncluded) {
      resolvedIds.Add(user.userId);
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
    const dmEventData: Record<string, unknown> = {};
    dmEventData["id"] = message.Id;
    dmEventData["sender_id"] = user.userId;
    dmEventData["type"] = "direct";
    dmEventData["dm_group_id"] = dmGroup.Id;
    dmEventData["content"] = renderedContent;
    dmEventData["timestamp"] = Convert.ToDouble(message.CreatedAt) / 1000;
    dispatchEventToTenant(user.tenantId, {
      type: "message",
      data: dmEventData,
    });

    return ok({ id: message.Id });
  }

  return err("Invalid message type: " + params.type);
};
