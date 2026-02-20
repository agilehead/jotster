import { List, Dictionary } from "@tsonic/dotnet/System.Collections.Generic.js";

export const checkMessageForAlertWords = (
  content: string,
  alertWords: { UserId: string; Word: string }[]
): string[] => {
  const contentLower = content.ToLower();
  const matchedUserIds = new List<string>();
  const seen = new Dictionary<string, boolean>();

  for (let i = 0; i < alertWords.length; i++) {
    const aw = alertWords[i];
    if (seen.ContainsKey(aw.UserId) && seen[aw.UserId] === true) {
      continue;
    }

    // Word is already stored lowercase
    const word = aw.Word;
    const idx = contentLower.IndexOf(word);
    if (idx >= 0) {
      // Check word boundaries
      const beforeOk = idx === 0 || !isAlphaNumeric(contentLower[idx - 1]);
      const afterIdx = idx + word.Length;
      const afterOk = afterIdx >= contentLower.Length || !isAlphaNumeric(contentLower[afterIdx]);
      if (beforeOk && afterOk) {
        matchedUserIds.Add(aw.UserId);
        seen[aw.UserId] = true;
      }
    }
  }

  return matchedUserIds.ToArray();
};

const isAlphaNumeric = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
};
