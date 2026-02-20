import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser, CustomEmoji } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomEmojiByName } from "../repo/get-custom-emoji-by-name.ts";
import { createCustomEmoji } from "../repo/create-custom-emoji.ts";
import { getCustomEmojisDomain } from "./get-custom-emojis-domain.ts";

export const createCustomEmojiDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  emojiName: string
): Promise<Result<CustomEmoji, string>> => {
  // Validate emoji name is not empty
  if (emojiName.Length === 0) {
    return err("Emoji name cannot be empty");
  }

  // Check uniqueness among active emoji
  const existing = await getCustomEmojiByName(options, user.tenantId, emojiName);
  if (existing !== undefined) {
    return err("An emoji with this name already exists");
  }

  // Create with placeholder filename (actual file upload handled by uploads package)
  const fileName = emojiName + ".png";

  const emoji = await createCustomEmoji(options, {
    tenantId: user.tenantId,
    name: emojiName,
    fileName,
    authorId: user.userId,
  });

  // Build full emoji map and dispatch realm_emoji event
  const emojiMap = await getCustomEmojisDomain(options, user.tenantId);

  dispatchEventToTenant(user.tenantId, {
    type: "realm_emoji",
    op: "update",
    data: {
      realm_emoji: emojiMap,
    },
  });

  return ok(emoji);
};
