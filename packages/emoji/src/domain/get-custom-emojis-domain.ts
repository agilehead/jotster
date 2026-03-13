import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { getCustomEmojis } from "../repo/get-custom-emojis.ts";

export const getCustomEmojisDomain = async (
  options: DbContextOptions,
  tenantId: string
): Promise<Record<string, unknown>> => {
  const emojis = await getCustomEmojis(options, tenantId);

  const emojiMap: Record<string, unknown> = {};
  for (let i = 0; i < emojis.length; i++) {
    const e = emojis[i];
    const entry: Record<string, unknown> = {};
    entry["id"] = e.Id;
    entry["name"] = e.Name;
    entry["source_url"] = "/user_uploads/" + e.TenantId + "/emoji/" + e.Id + "/" + e.FileName;
    entry["author_id"] = e.AuthorId;
    entry["deactivated"] = false;
    emojiMap[e.Id] = entry;
  }

  return emojiMap;
};
