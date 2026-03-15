import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ApiKey, generateId, ok, err } from "@jotster/core/Jotster.Core.js";
import { generateApiKey, hashApiKey } from "@jotster/auth/Jotster.Auth.js";
import { getUserByEmail } from "../repo/get-user-by-email.ts";
import { createUser } from "../repo/create-user.ts";
import { createUserSetting } from "../repo/create-user-setting.ts";

export const createBotDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  input: { fullName: string; shortName: string; botType?: int }
): Promise<Result<{ userId: long; apiKey: string }, string>> => {
  const botEmail = `${input.shortName}-bot@jotster.local`;

  const existing = await getUserByEmail(options, actingUser.tenantId, botEmail);
  if (existing !== undefined) {
    return err("Bot with this short name already exists");
  }

  const botType = (input.botType ?? 1) as int;

  const user = await createUser(options, {
    tenantId: actingUser.tenantId,
    email: botEmail,
    fullName: input.fullName,
    isBot: 1 as int,
    botType,
    botOwnerId: actingUser.userId,
  });

  await createUserSetting(options, user.Id, actingUser.tenantId);

  // Generate and store API key
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
    const apiKey = new ApiKey();
    apiKey.Id = generateId();
    apiKey.TenantId = actingUser.tenantId;
    apiKey.UserId = user.Id;
    apiKey.KeyHash = keyHash;
    apiKey.RawKey = rawKey;
    apiKey.CreatedAt = now;
    db.ApiKeys.Add(apiKey);
    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }

  return ok({ userId: user.Id, apiKey: rawKey });
};
