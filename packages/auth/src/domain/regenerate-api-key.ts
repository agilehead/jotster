import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserById } from "../repo/get-user-by-id.ts";
import { revokeAllApiKeys } from "../repo/revoke-all-api-keys.ts";
import { generateApiKey } from "../crypto/generate-api-key.ts";
import { hashApiKey } from "../crypto/hash-api-key.ts";
import { createApiKey } from "../repo/create-api-key.ts";

export const regenerateApiKey = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<
  Result<{ api_key: string; email: string; user_id: long }, string>
> => {
  const user = await getUserById(options, userId);
  if (user === undefined) {
    return err("User not found");
  }

  await revokeAllApiKeys(options, tenantId, userId);

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  await createApiKey(options, tenantId, userId, keyHash, rawKey);

  return ok({ api_key: rawKey, email: user.Email, user_id: user.Id });
};
