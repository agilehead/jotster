import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { uploadRealmImageDomain } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUploadRealmLogo = async (
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

  const file = req.file;
  if (!file) {
    res.status(400).json({ result: "error", msg: "No file uploaded" });
    return;
  }

  const uploadsDir = app.config.uploadsDir || "./uploads";

  const result = await uploadRealmImageDomain(
    app.options,
    user,
    uploadsDir,
    "logo",
    file,
  );

  if (!result.success) {
    res.status(400).json({ result: "error", msg: result.error });
    return;
  }

  res.json({ result: "success", msg: "", logo_url: result.data.url });
};
