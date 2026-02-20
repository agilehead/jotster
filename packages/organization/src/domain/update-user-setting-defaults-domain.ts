import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateUserSettingDefaults } from "../repo/update-user-setting-defaults.ts";

export const updateUserSettingDefaultsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  updates: Record<string, unknown>
): Promise<Result<Record<string, unknown>, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  const result = await updateUserSettingDefaults(options, user.tenantId, updates);

  // Emit realm_user_settings_defaults event
  dispatchEventToTenant(user.tenantId, {
    type: "realm_user_settings_defaults",
    op: "update",
    data: {
      property: "default",
      data: result,
    },
  });

  return ok(result);
};
