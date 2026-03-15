import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateTenantSettings } from "../repo/update-tenant-settings.ts";

export const deleteRealmImageDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  imageType: string,
): Promise<Result<boolean, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  if (imageType !== "icon" && imageType !== "logo") {
    return err("Invalid image type");
  }

  const settingKey = imageType === "icon" ? "icon_url" : "logo_url";
  const settings: Record<string, unknown> = {};
  settings[settingKey] = undefined;

  await updateTenantSettings(options, user.tenantId, settings);

  // Emit realm event
  dispatchEventToTenant(user.tenantId, {
    type: "realm",
    op: "update",
    data: {
      property: settingKey,
      value: undefined,
    },
  });

  return ok(true);
};
