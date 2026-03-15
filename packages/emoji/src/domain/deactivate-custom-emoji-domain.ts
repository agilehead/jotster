import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomEmojiByName } from "../repo/get-custom-emoji-by-name.ts";
import { deactivateCustomEmoji } from "../repo/deactivate-custom-emoji.ts";
import { getCustomEmojisDomain } from "./get-custom-emojis-domain.ts";

export const deactivateCustomEmojiDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  emojiName: string,
): Promise<Result<void, string>> => {
  // Validate emoji exists and is active
  const existing = await getCustomEmojiByName(
    options,
    user.tenantId,
    emojiName,
  );
  if (existing === undefined) {
    return err("Emoji not found");
  }

  const result = await deactivateCustomEmoji(options, user.tenantId, emojiName);
  if (!result) {
    return err("Failed to deactivate emoji");
  }

  // Build full emoji map and dispatch realm_emoji event
  const emojiMap = await getCustomEmojisDomain(options, user.tenantId);

  const eventData: Record<string, unknown> = {};
  eventData["realm_emoji"] = emojiMap;

  dispatchEventToTenant(user.tenantId, {
    type: "realm_emoji",
    op: "update",
    data: eventData,
  });

  return ok(undefined);
};
