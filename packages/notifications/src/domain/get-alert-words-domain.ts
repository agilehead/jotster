import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getAlertWords } from "../repo/get-alert-words.ts";

export const getAlertWordsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser
): Promise<Result<string[], string>> => {
  const alertWords = await getAlertWords(options, user.tenantId, user.userId);

  const words = new List<string>();
  for (let i = 0; i < alertWords.length; i++) {
    words.Add(alertWords[i].Word);
  }

  return ok(words.ToArray());
};
