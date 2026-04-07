import type { long } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { existsSync, readFileSync } from "@tsonic/nodejs/fs.js";
import { join } from "@tsonic/nodejs/path.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { parseId } from "@jotster/core/Jotster.Core.js";
import { getCustomEmojiById } from "@jotster/emoji/Jotster.Emoji.js";
import { serveFileDomain } from "@jotster/uploads/Jotster.Uploads.js";
import { toLong } from "../helpers/body.ts";
import type { AppContext } from "../helpers/app-context.ts";

export const handleServeFile = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const tenantId = req.param("tenant_id") ?? "";
  const emojiId = req.param("emoji_id");
  const fileName = req.param("filename");
  const pathId =
    emojiId !== undefined
      ? "emoji/" + emojiId + "/" + (fileName ?? "")
      : (req.param("0") ?? req.param("path_id") ?? "");

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const tenantIdLong = parseId(tenantId);
  const emojiFile =
    tenantIdLong !== undefined
      ? await tryServeCustomEmoji(app, toLong(tenantIdLong), pathId)
      : undefined;
  if (emojiFile !== undefined) {
    res.set("Content-Type", emojiFile.contentType);
    res.set(
      "Content-Disposition",
      'inline; filename="' + emojiFile.fileName + '"',
    );
    res.send(readFileSync(emojiFile.filePath).buffer);
    return;
  }

  const result = await serveFileDomain(
    app.options,
    user,
    uploadsDir,
    tenantId,
    pathId,
  );
  if (!result.success) {
    res.status(404).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.set("Content-Type", data.contentType);
  res.set("Content-Disposition", 'inline; filename="' + data.fileName + '"');
  res.send(readFileSync(data.filePath).buffer);
};

const tryServeCustomEmoji = async (
  app: AppContext,
  tenantId: long,
  pathId: string,
): Promise<
  { contentType: string; fileName: string; filePath: string } | undefined
> => {
  const segments = pathId.split("/");
  if (segments.length < 3 || segments[0] !== "emoji") {
    return undefined;
  }

  const emojiId = parseId(segments[1]);
  if (emojiId === undefined) {
    return undefined;
  }

  const emoji = await getCustomEmojiById(
    app.options,
    tenantId,
    toLong(emojiId),
  );
  if (emoji === undefined) {
    return undefined;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";
  const filePath = join(
    uploadsDir,
    `${tenantId}`,
    "emoji",
    `${emoji.Id}`,
    emoji.FileName,
  );
  if (!existsSync(filePath)) {
    return undefined;
  }

  return {
    filePath,
    fileName: emoji.FileName,
    contentType: getContentTypeForFileName(emoji.FileName),
  };
};

const getContentTypeForFileName = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
};
