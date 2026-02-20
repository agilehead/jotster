import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { muteUser } from "../repo/mute-user.ts";
import { getMutedUsers } from "../repo/get-muted-users.ts";

export const muteUserDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  mutedUserId: string
): Promise<Result<void, string>> => {
  // Validate not self-muting
  if (user.userId === mutedUserId) {
    return err("Cannot mute yourself");
  }

  // Check user exists in tenant
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const mutedUserId0 = mutedUserId;
    const targetUser = await db0.Users
      .Where((u) => u.TenantId === tenantId0).Where((u) => u.Id === mutedUserId0)
      .FirstOrDefaultAsync();

    if (targetUser === undefined || targetUser === null) {
      return err("User not found");
    }
  } finally {
    db.Dispose();
  }

  // Check not already muted
  const existingMuted = await getMutedUsers(options, user.tenantId, user.userId);
  for (let i = 0; i < existingMuted.Length; i++) {
    if (existingMuted[i].MutedUserId === mutedUserId) {
      return err("User is already muted");
    }
  }

  // Mute the user
  await muteUser(options, user.tenantId, user.userId, mutedUserId);

  // Get full list and dispatch event
  const allMuted = await getMutedUsers(options, user.tenantId, user.userId);
  const mutedUserIds = new List<string>();
  for (let i = 0; i < allMuted.Length; i++) {
    mutedUserIds.Add(allMuted[i].MutedUserId);
  }

  dispatchEventToUser(user.tenantId, user.userId, {
    type: "muted_users",
    data: {
      muted_users: mutedUserIds.ToArray(),
    },
  });

  return ok(undefined);
};
