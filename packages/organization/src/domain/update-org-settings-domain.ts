import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateTenantSettings } from "../repo/update-tenant-settings.ts";

export const updateOrgSettingsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  settings: Record<string, unknown>
): Promise<Result<boolean, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  const tenant = await updateTenantSettings(options, user.tenantId, settings);
  if (tenant === undefined) {
    return err("Organization not found");
  }

  // Emit realm event
  const keys = Object.keys(settings);
  if (keys.length === 1) {
    const key = keys[0];
    dispatchEventToTenant(user.tenantId, {
      type: "realm",
      op: "update",
      data: {
        property: key,
        value: settings[key],
      },
    });
  } else if (keys.length > 1) {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < keys.length; i++) {
      data[keys[i]] = settings[keys[i]];
    }
    dispatchEventToTenant(user.tenantId, {
      type: "realm",
      op: "update_dict",
      data: {
        property: "default",
        data,
      },
    });
  }

  return ok(true);
};
