import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getMessage } from "../repo/get-message.ts";
import { removeReaction } from "../repo/remove-reaction.ts";

interface RemoveReactionDomainInput {
  emojiName: string;
  emojiCode: string;
  reactionType: string;
}

export const removeReactionDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string,
  params: RemoveReactionDomainInput
): Promise<Result<void, string>> => {
  // Verify message exists in tenant
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return err("Message not found");
  }

  // Remove reaction
  const result = await removeReaction(
    options,
    user.tenantId,
    messageId,
    user.userId,
    params.emojiCode,
    params.reactionType
  );

  if (!result) {
    return err("Reaction does not exist");
  }

  // Dispatch event
  dispatchEventToTenant(user.tenantId, {
    type: "reaction",
    op: "remove",
    data: {
      message_id: messageId,
      user_id: user.userId,
      emoji_name: params.emojiName,
      emoji_code: params.emojiCode,
      reaction_type: params.reactionType,
    },
  });

  return ok(undefined);
};
