import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, User, ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";

export const updateBotDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  botId: string,
  updates: { fullName?: string; botOwnerId?: string }
): Promise<Result<User, string>> => {
  const bot = await getUser(options, botId);
  if (bot === undefined) {
    return err("Bot not found");
  }

  if (bot.TenantId !== actingUser.tenantId) {
    return err("Bot not found");
  }

  if (bot.IsBot !== (1 as int)) {
    return err("User is not a bot");
  }

  const isOwner = bot.BotOwnerId === actingUser.userId;
  const isAdmin = actingUser.role <= 200;

  if (!isOwner && !isAdmin) {
    return err("Insufficient permission");
  }

  // botOwnerId change requires admin
  if (updates.botOwnerId !== undefined && !isAdmin) {
    return err("Insufficient permission");
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const botId0 = botId;
    const tenantId0 = actingUser.tenantId;
    const botEntity = await db0.Users
      .Where((u) => u.Id === botId0).Where((u) => u.TenantId === tenantId0)
      .FirstOrDefaultAsync();

    if (botEntity === undefined) {
      return err("Bot not found");
    }

    if (updates.fullName !== undefined) {
      botEntity.FullName = updates.fullName;
    }
    if (updates.botOwnerId !== undefined) {
      botEntity.BotOwnerId = updates.botOwnerId;
    }

    botEntity.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    await db0.SaveChangesAsync();
    return ok(botEntity);
  } finally {
    db.Dispose();
  }
};
