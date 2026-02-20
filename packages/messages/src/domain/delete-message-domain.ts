import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getMessage } from "../repo/get-message.ts";
import { deleteMessage } from "../repo/delete-message.ts";

// Time limit for non-admins to delete their own messages (10 minutes)
const DELETE_TIME_LIMIT_MS = 600000;

export const deleteMessageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string
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
    const now = Date.now();
    const messageTime = Number(message.CreatedAt);
    if (now - messageTime > DELETE_TIME_LIMIT_MS) {
      return err("You can no longer delete this message");
    }
  }

  const result = await deleteMessage(options, user.tenantId, messageId);
  if (!result) {
    return err("Failed to delete message");
  }

  // Dispatch event
  dispatchEventToTenant(user.tenantId, {
    type: "delete_message",
    data: {
      message_id: messageId,
      message_type: message.Type === "stream" ? "stream" : "direct",
      stream_id: message.ChannelId,
      topic: message.Topic,
      dm_group_id: message.DmGroupId,
    },
  });

  return ok(undefined);
};
