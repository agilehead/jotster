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
      .ToArrayAsync();

    const readMessageIds = new Set<string>();
    for (let i = 0; i < readFlags.Length; i++) {
      readMessageIds.add(readFlags[i].MessageId);
    }

    // Get all messages in the tenant
    const allMessages = await db0.Messages
      .Where((m) => m.TenantId === tenantId0)
      .ToArrayAsync();

    // Find unread message IDs
    const unreadIds = new List<string>();
    for (let i = 0; i < allMessages.Length; i++) {
      if (!readMessageIds.has(allMessages[i].Id)) {
        unreadIds.Add(allMessages[i].Id);
      }
    }

    if (unreadIds.Count > 0) {
      await addMessageFlags(options, user.userId, unreadIds.ToArray(), "read");
    }

    // Dispatch event
    dispatchEventToUser(user.tenantId, user.userId, {
      type: "update_message_flags",
      op: "add",
      data: {
        flag: "read",
        messages: unreadIds.ToArray(),
        all: true,
      },
    });

    return ok(undefined);
  } finally {
    db.Dispose();
  }
};
