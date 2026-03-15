import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getMessage } from "../repo/get-message.ts";
import { getReactionsForMessage } from "../repo/get-reactions-for-message.ts";
import { addReaction } from "../repo/add-reaction.ts";

interface AddReactionDomainInput {
  emojiName: string;
  emojiCode: string;
  reactionType: string;
}

export const addReactionDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: long,
  params: AddReactionDomainInput,
): Promise<Result<void, string>> => {
  // Verify message exists in tenant
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  // Verify user has access to this message
  if (message.Type === "stream") {
    // Check subscription
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = user.tenantId;
      const userId0 = user.userId;
      const channelId0 = message.ChannelId!;
      const sub = await db0.Subscriptions.Where((s) => s.TenantId === tenantId0)
        .Where((s) => s.UserId === userId0)
        .Where((s) => s.ChannelId === channelId0)
        .FirstOrDefaultAsync();

      if (sub === undefined || sub === null) {
        return err("Not subscribed to this channel");
      }
    } finally {
      db.Dispose();
    }
  } else {
    // Check DM group membership
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const userId0 = user.userId;
      const dmGroupId0 = message.DmGroupId!;
      const member = await db0.DmGroupMembers.Where(
        (m) => m.DmGroupId === dmGroupId0,
      )
        .Where((m) => m.UserId === userId0)
        .FirstOrDefaultAsync();

      if (member === undefined || member === null) {
        return err("Not a member of this DM group");
      }
    } finally {
      db.Dispose();
    }
  }

  // Check for duplicate reaction
  const existingReactions = await getReactionsForMessage(
    options,
    user.tenantId,
    messageId,
  );
  for (let i = 0; i < existingReactions.length; i++) {
    const r = existingReactions[i];
    if (
      r.UserId === user.userId &&
      r.EmojiCode === params.emojiCode &&
      r.ReactionType === params.reactionType
    ) {
      return err("Reaction already exists");
    }
  }

  // Add reaction
  const reaction = await addReaction(options, {
    tenantId: user.tenantId,
    messageId,
    userId: user.userId,
    emojiName: params.emojiName,
    emojiCode: params.emojiCode,
    reactionType: params.reactionType,
  });

  // Dispatch event
  const eventData: Record<string, unknown> = {};
  eventData["message_id"] = messageId;
  eventData["user_id"] = user.userId;
  eventData["emoji_name"] = params.emojiName;
  eventData["emoji_code"] = params.emojiCode;
  eventData["reaction_type"] = params.reactionType;
  dispatchEventToTenant(user.tenantId, {
    type: "reaction",
    op: "add",
    data: eventData,
  });

  return ok(undefined);
};
