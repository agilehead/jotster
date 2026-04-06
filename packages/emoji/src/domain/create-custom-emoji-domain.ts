import type { JsValue } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { existsSync, mkdirSync } from "@tsonic/nodejs/fs.js";
import { extname, join } from "@tsonic/nodejs/path.js";
import type {
  Result,
  AuthenticatedUser,
  CustomEmoji,
} from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomEmojiByName } from "../repo/get-custom-emoji-by-name.ts";
import { createCustomEmoji } from "../repo/create-custom-emoji.ts";
import { getCustomEmojisDomain } from "./get-custom-emojis-domain.ts";
import type { UploadedFile } from "@tsonic/express/index.js";

export const createCustomEmojiDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  emojiName: string,
  file: UploadedFile,
): Promise<Result<CustomEmoji, string>> => {
  // Validate emoji name is not empty
  if (emojiName.length === 0) {
    return err("Emoji name cannot be empty");
  }

  // Check uniqueness among active emoji
  const existing = await getCustomEmojiByName(
    options,
    user.tenantId,
    emojiName,
  );
  if (existing !== undefined) {
    return err("An emoji with this name already exists");
  }

  const fileName = resolveStoredFileName(emojiName, file.originalname);

  const emoji = await createCustomEmoji(options, {
    tenantId: user.tenantId,
    name: emojiName,
    fileName,
    authorId: user.userId,
  });

  const emojiDir = join(
    uploadsDir,
    String(user.tenantId),
    "emoji",
    String(emoji.Id),
  );
  if (!existsSync(emojiDir)) {
    mkdirSync(emojiDir, true);
  }
  await file.save(join(emojiDir, fileName));

  // Build full emoji map and dispatch realm_emoji event
  const emojiMap = await getCustomEmojisDomain(options, user.tenantId);

  const eventData: Record<string, JsValue> = {};
  eventData["realm_emoji"] = emojiMap;

  dispatchEventToTenant(user.tenantId, {
    type: "realm_emoji",
    op: "update",
    data: eventData,
  });

  return ok(emoji);
};

const resolveStoredFileName = (
  emojiName: string,
  originalName: string,
): string => {
  const ext = extname(originalName);
  if (ext === "") {
    return emojiName + ".png";
  }

  return emojiName + ext.toLowerCase();
};
