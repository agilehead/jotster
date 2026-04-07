import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { setUserStatus } from "../repo/set-user-status.ts";

interface SetUserStatusParams {
  statusText?: string;
  emojiName?: string;
  emojiCode?: string;
  reactionType?: string;
}

export const setUserStatusDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  params: SetUserStatusParams,
): Promise<Result<void, string>> => {
  const statusText = params.statusText ?? "";

  const userStatus = await setUserStatus(
    options,
    user.tenantId,
    user.userId,
    statusText,
    params.emojiName,
    params.emojiCode,
    params.reactionType,
  );

  // Dispatch user_status event to tenant
  dispatchEventToTenant(user.tenantId, {
    type: "user_status",
    data: {
      user_id: user.userId,
      status_text: userStatus.StatusText,
      emoji_name: userStatus.EmojiName ?? null,
      emoji_code: userStatus.EmojiCode ?? null,
      reaction_type: userStatus.ReactionType ?? null,
    },
  });

  return ok(undefined);
};
