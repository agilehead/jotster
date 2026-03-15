import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { createCustomEmojiDomain } from "@jotster/emoji/Jotster.Emoji.js";
import type { UploadedFile } from "@tsonic/express/index.js";
import type { AppContext } from "../helpers/app-context.ts";

const getUploadedFile = (req: Request): UploadedFile | undefined => {
  if (req.file !== undefined) {
    return req.file;
  }

  const filenameFiles = req.files["filename"];
  if (filenameFiles !== undefined && filenameFiles.length > 0) {
    return filenameFiles[0];
  }

  const fileFiles = req.files["file"];
  if (fileFiles !== undefined && fileFiles.length > 0) {
    return fileFiles[0];
  }

  return undefined;
};

export const handleUploadCustomEmoji = async (
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

  // Admin only: role <= 200
  if (user.role > 200) {
    res.status(403).json({ result: "error", msg: "Insufficient permission" });
    return;
  }

  const emojiName = req.params["emoji_name"] as string;
  if (!emojiName) {
    res.status(400).json({ result: "error", msg: "Missing emoji name" });
    return;
  }

  const file = getUploadedFile(req);
  if (file === undefined) {
    res.status(400).json({ result: "error", msg: "No file uploaded" });
    return;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";
  const result = await createCustomEmojiDomain(
    app.options,
    user,
    uploadsDir,
    emojiName,
    file,
  );
  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "" });
};
