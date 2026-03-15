import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { unmuteUser } from "../repo/unmute-user.ts";
import { getMutedUsers } from "../repo/get-muted-users.ts";

export const unmuteUserDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  mutedUserId: long,
): Promise<Result<void, string>> => {
  const removed = await unmuteUser(
    options,
    user.tenantId,
    user.userId,
    mutedUserId,
  );

  if (!removed) {
    return err("User is not muted");
  }

  // Get full list and dispatch event
  const allMuted = await getMutedUsers(options, user.tenantId, user.userId);
  const mutedUserIds = new List<long>();
  for (let i = 0; i < allMuted.length; i++) {
    const mutedEntry = allMuted[i];
    mutedUserIds.Add(mutedEntry.MutedUserId);
  }

  dispatchEventToUser(user.tenantId, user.userId, {
    type: "muted_users",
    data: {
      muted_users: mutedUserIds.ToArray(),
    },
  });

  return ok(undefined);
};
