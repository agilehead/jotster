import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { Convert, DateTimeOffset } from "@tsonic/dotnet/System.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getMessage } from "../repo/get-message.ts";
import { deleteMessage } from "../repo/delete-message.ts";

// Time limit for non-admins to delete their own messages (10 minutes)
const DELETE_TIME_LIMIT_MS = 600000;

export const deleteMessageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: long,
): Promise<Result<void, string>> => {
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  const isSender = message.SenderId === user.userId;
  const isAdmin = user.role <= 200;

  if (!isSender && !isAdmin) {
    return err("You can only delete your own messages");
  }

  // Non-admin senders have a time limit
  if (isSender && !isAdmin) {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    const messageTime = Convert.ToInt64(message.CreatedAt);
    if (now - messageTime > DELETE_TIME_LIMIT_MS) {
      return err("You can no longer delete this message");
    }
  }

  const result = await deleteMessage(options, user.tenantId, messageId);
  if (!result) {
    return err("Failed to delete message");
  }

  // Dispatch event
  const eventData: Record<string, unknown> = {};
  eventData["message_id"] = messageId;
  eventData["message_type"] = message.Type === "stream" ? "stream" : "direct";
  eventData["stream_id"] = message.ChannelId;
  eventData["topic"] = message.Topic;
  eventData["dm_group_id"] = message.DmGroupId;
  dispatchEventToTenant(user.tenantId, {
    type: "delete_message",
    data: eventData,
  });

  return ok(undefined);
};
