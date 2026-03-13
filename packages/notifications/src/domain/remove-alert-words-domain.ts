import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { removeAlertWords } from "../repo/remove-alert-words.ts";
import { getAlertWords } from "../repo/get-alert-words.ts";

export const removeAlertWordsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  words: string[]
): Promise<Result<string[], string>> => {
  await removeAlertWords(options, user.tenantId, user.userId, words);

  // Get full updated list
  const allAlertWords = await getAlertWords(options, user.tenantId, user.userId);
  const wordList = new List<string>();
  for (let i = 0; i < allAlertWords.length; i++) {
    wordList.Add(allAlertWords[i].Word);
  }

  // Dispatch event to owning user
  dispatchEventToUser(user.tenantId, user.userId, {
    type: "alert_words",
    data: {
      alert_words: wordList.ToArray(),
    },
  });

  return ok(wordList.ToArray());
};
