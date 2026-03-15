import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { getCustomEmojis } from "../repo/get-custom-emojis.ts";

export const getCustomEmojisDomain = async (
  options: DbContextOptions,
  tenantId: long,
): Promise<Record<string, unknown>> => {
  const emojis = await getCustomEmojis(options, tenantId);

  const emojiMap: Record<string, unknown> = {};
  for (let i = 0; i < emojis.length; i++) {
    const e = emojis[i];
    const entry: Record<string, unknown> = {};
    entry["id"] = e.Id;
    entry["name"] = e.Name;
    entry["source_url"] =
      "/user_uploads/" +
      String(e.TenantId) +
      "/emoji/" +
      String(e.Id) +
      "/" +
      e.FileName;
    entry["author_id"] = e.AuthorId;
    entry["deactivated"] = false;
    emojiMap[String(e.Id)] = entry;
  }

  return emojiMap;
};
