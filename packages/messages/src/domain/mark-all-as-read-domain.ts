import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { addMessageFlags } from "../repo/add-message-flags.ts";

export const markAllAsReadDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<void, string>> => {
  // Get all messages in the tenant that the user has not read
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const userId0 = user.userId;
    const readFlag = "read";

    // Get all read message IDs for this user
    const readFlags = await db0.MessageFlags
      .Where((f) => f.UserId === userId0).Where((f) => f.Flag === readFlag)
      .ToListAsync();

    const readMessageIds = new List<long>();
    for (let i = 0; i < readFlags.Count; i++) {
      const readFlagEntry = readFlags[i];
      readMessageIds.Add(readFlagEntry.MessageId);
    }

    // Get all messages in the tenant
    const allMessages = await db0.Messages
      .Where((m) => m.TenantId === tenantId0)
      .ToListAsync();

    // Find unread message IDs
    const unreadIds = new List<long>();
    for (let j = 0; j < allMessages.Count; j++) {
      const message = allMessages[j];
      let isRead = false;
      for (let k = 0; k < readMessageIds.Count; k++) {
        if (readMessageIds[k] === message.Id) {
          isRead = true;
          break;
        }
      }
      if (!isRead) {
        unreadIds.Add(message.Id);
      }
    }

    if (unreadIds.Count > 0) {
      await addMessageFlags(options, user.userId, unreadIds.ToArray(), "read");
    }

    // Dispatch event
    const eventData: Record<string, unknown> = {};
    eventData["flag"] = "read";
    eventData["messages"] = unreadIds.ToArray();
    eventData["all"] = true;
    dispatchEventToUser(user.tenantId, user.userId, {
      type: "update_message_flags",
      op: "add",
      data: eventData,
    });

    return ok(undefined);
  } finally {
    db.Dispose();
  }
};
