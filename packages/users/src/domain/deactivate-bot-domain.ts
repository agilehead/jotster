import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUser } from "../repo/get-user.ts";
import { deactivateUser } from "../repo/deactivate-user.ts";

export const deactivateBotDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  botId: long,
): Promise<Result<boolean, string>> => {
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

  const result = await deactivateUser(options, actingUser.tenantId, botId);
  if (!result) {
    return err("Failed to deactivate bot");
  }

  return ok(true);
};
