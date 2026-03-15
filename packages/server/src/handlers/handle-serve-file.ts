import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getCustomEmojiById } from "@jotster/emoji/Jotster.Emoji.js";
import { serveFileDomain } from "@jotster/uploads/Jotster.Uploads.js";
import { fs, path } from "@tsonic/nodejs/index.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleServeFile = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  const tenantId = req.params["tenant_id"] as string;
  const emojiId = req.params["emoji_id"] as string | undefined;
  const fileName = req.params["filename"] as string | undefined;
  const pathId = emojiId !== undefined
    ? "emoji/" + emojiId + "/" + (fileName ?? "")
    : (req.params["0"] as string | undefined) ?? (req.params["path_id"] as string);

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const emojiFile = await tryServeCustomEmoji(app, tenantId, pathId);
  if (emojiFile !== undefined) {
    res.set("Content-Type", emojiFile.contentType);
    res.set("Content-Disposition", "inline; filename=\"" + emojiFile.fileName + "\"");
    res.sendFile(emojiFile.filePath);
    return;
  }

  const result = await serveFileDomain(app.options, user, uploadsDir, tenantId, pathId);
  if (!result.success) {
    res.status(404).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.set("Content-Type", data.contentType);
  res.set("Content-Disposition", "inline; filename=\"" + data.fileName + "\"");
  res.sendFile(data.filePath);
};

const tryServeCustomEmoji = async (
  app: AppContext,
  tenantId: string,
  pathId: string,
): Promise<{ contentType: string; fileName: string; filePath: string } | undefined> => {
  const segments = pathId.split("/");
  if (segments.length < 3 || segments[0] !== "emoji") {
    return undefined;
  }

  const emoji = await getCustomEmojiById(app.options, tenantId, segments[1]);
  if (emoji === undefined) {
    return undefined;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";
  const filePath = path.join(uploadsDir, tenantId, "emoji", emoji.Id, emoji.FileName);
  if (!fs.existsSync(filePath)) {
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
