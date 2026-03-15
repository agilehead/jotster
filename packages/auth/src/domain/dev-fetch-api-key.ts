import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserByEmail } from "../repo/get-user-by-email.ts";
import { generateApiKey } from "../crypto/generate-api-key.ts";
import { hashApiKey } from "../crypto/hash-api-key.ts";
import { createApiKey } from "../repo/create-api-key.ts";
import { getActiveApiKey } from "../repo/get-active-api-key.ts";

export const devFetchApiKey = async (
  options: DbContextOptions,
  _config: ServerConfig,
  tenantId: string,
  email: string
): Promise<Result<{ api_key: string; email: string; user_id: string }, string>> => {
  const user = await getUserByEmail(options, tenantId, email);
  if (user === undefined) {
    return err("Your username or password is incorrect");
  }
  if (user.IsActive !== 1) {
    return err("Account is deactivated");
  }

  const activeApiKey = await getActiveApiKey(options, tenantId, user.Id);
  if (activeApiKey?.RawKey !== undefined && activeApiKey.RawKey !== null && activeApiKey.RawKey !== "") {
    return ok({ api_key: activeApiKey.RawKey, email: user.Email, user_id: user.Id });
  }

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  await createApiKey(options, tenantId, user.Id, keyHash, rawKey);

  return ok({ api_key: rawKey, email: user.Email, user_id: user.Id });
};
