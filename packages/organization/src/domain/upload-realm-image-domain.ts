import { fs, path } from "@tsonic/nodejs/index.js";
import type { UploadedFile } from "@tsonic/express/index.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err, generateId } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateTenantSettings } from "../repo/update-tenant-settings.ts";

export const uploadRealmImageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  uploadsDir: string,
  imageType: string,
  file: UploadedFile
): Promise<Result<{ url: string }, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  if (imageType !== "icon" && imageType !== "logo") {
    return err("Invalid image type");
  }

  const fileName = file.originalname;
  const ext = path.extname(fileName);
  const pathId = generateId() + ext;

  const dirPath = path.join(uploadsDir, user.tenantId);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, pathId);
  await file.save(filePath);

  const url = "/user_uploads/" + user.tenantId + "/" + pathId;

  const settingKey = imageType === "icon" ? "icon_url" : "logo_url";
  const settings: Record<string, unknown> = {};
  settings[settingKey] = url;

  await updateTenantSettings(options, user.tenantId, settings);

  // Emit realm event
  dispatchEventToTenant(user.tenantId, {
    type: "realm",
    op: "update",
    data: {
      property: settingKey,
      value: url,
    },
  });

  return ok({ url });
};
