import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { uploadFileDomain } from "@jotster/uploads/Jotster.Uploads.js";
import type { UploadedFile } from "@tsonic/express/index.js";
import type { AppContext } from "../helpers/app-context.ts";

const getUploadedFile = (req: Request): UploadedFile | undefined => {
  if (req.file !== undefined) {
    return req.file;
  }

  const filenameFiles = req.files.get("filename");
  if (filenameFiles !== undefined && filenameFiles.length > 0) {
    return filenameFiles[0];
  }

  const fileFiles = req.files.get("file");
  if (fileFiles !== undefined && fileFiles.length > 0) {
    return fileFiles[0];
  }

  return undefined;
};

export const handleUploadFile = async (
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

  const file = getUploadedFile(req);
  if (!file) {
    res.status(400).json({ result: "error", msg: "No file uploaded" });
    return;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const result = await uploadFileDomain(app.options, user, uploadsDir, file);

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  const data = result.data;
  res.json({
    result: "success",
    msg: "",
    uri: data.uri,
    url: data.url,
    filename: data.filename,
  });
};
