import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserStatus } from "../repo/get-user-status.ts";

export const getUserStatusDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  targetUserId: long,
): Promise<Result<Record<string, unknown>, string>> => {
  const status = await getUserStatus(options, user.tenantId, targetUserId);

  if (status === undefined) {
    return ok({
      status_text: "",
      emoji_name: undefined,
      emoji_code: undefined,
      reaction_type: undefined,
    });
  }

  return ok({
    status_text: status.StatusText,
    emoji_name: status.EmojiName,
    emoji_code: status.EmojiCode,
    reaction_type: status.ReactionType,
  });
};
