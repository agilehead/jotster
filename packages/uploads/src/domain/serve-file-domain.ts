import { existsSync } from "@tsonic/nodejs/fs.js";
import { join } from "@tsonic/nodejs/path.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getAttachmentByPath } from "../repo/get-attachment-by-path.ts";

type ServeFileResult = {
  filePath: string;
  contentType: string;
  fileName: string;
};

export const serveFileDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  tenantId: string,
  pathId: string,
): Promise<Result<ServeFileResult, string>> => {
  // Verify user belongs to the requested tenant
  if (String(user.tenantId) !== tenantId) {
    return err("You do not have access to this file");
  }

  const normalizedPathId = pathId.split("/")[0];
  const attachment = await getAttachmentByPath(
    options,
    user.tenantId,
    normalizedPathId,
  );
  if (attachment === undefined) {
    return err("File not found");
  }

  const filePath = join(uploadsDir, tenantId, normalizedPathId);
  if (!existsSync(filePath)) {
    return err("File not found on disk");
  }

  return ok({
    filePath,
    contentType: attachment.ContentType,
    fileName: attachment.FileName,
  });
};
