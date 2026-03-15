import type { int, long } from "@tsonic/core/types.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";


export const checkMessageForAlertWords = (
  content: string,
  alertWords: { UserId: long; Word: string }[]
): long[] => {
  const contentLower = content.toLowerCase();
  const matchedUserIds = new List<long>();
  const seen: Record<string, boolean> = {};

  for (let i = 0; i < alertWords.length; i++) {
    const aw = alertWords[i];
    const userIdKey = Convert.ToString(aw.UserId);
    if (seen[userIdKey] === true) {
      continue;
    }

    // Word is already stored lowercase
    const word = aw.Word;
    const idx = contentLower.indexOf(word);
    if (idx >= 0) {
      // Check word boundaries
      const beforeOk = idx === 0 || !isAlphaNumeric(contentLower, (idx - 1) as int);
      const afterIdx = (idx + word.length) as int;
      const afterOk = afterIdx >= contentLower.length || !isAlphaNumeric(contentLower, afterIdx);
      if (beforeOk && afterOk) {
        matchedUserIds.Add(aw.UserId);
        seen[userIdKey] = true;
      }
    }
  }

  return matchedUserIds.ToArray();
};

const isAlphaNumeric = (text: string, index: int): boolean => {
  const code = Convert.ToInt32(text[index]);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
};
