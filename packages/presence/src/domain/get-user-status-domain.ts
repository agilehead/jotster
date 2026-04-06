import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserStatus } from "../repo/get-user-status.ts";

export const getUserStatusDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  targetUserId: long,
): Promise<Result<Record<string, JsValue>, string>> => {
  const status = await getUserStatus(options, user.tenantId, targetUserId);

  if (status === undefined) {
    return ok({
      status_text: "",
      emoji_name: null,
      emoji_code: null,
      reaction_type: null,
    });
  }

  return ok({
    status_text: status.StatusText,
    emoji_name: status.EmojiName ?? null,
    emoji_code: status.EmojiCode ?? null,
    reaction_type: status.ReactionType ?? null,
  });
};
