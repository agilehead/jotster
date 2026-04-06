import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import type { JsValue } from "@tsonic/core/types.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getUserSettingDefaults } from "../repo/get-user-setting-defaults.ts";
import { updateUserSettingDefaults } from "../repo/update-user-setting-defaults.ts";

export const updateUserSettingDefaultsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  updates: Record<string, JsValue>,
): Promise<Result<Record<string, JsValue>, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  const previous = await getUserSettingDefaults(options, user.tenantId);
  const result = await updateUserSettingDefaults(
    options,
    user.tenantId,
    updates,
  );

  const updateKeys = Object.keys(updates);
  for (let i = 0; i < updateKeys.length; i++) {
    const key = updateKeys[i];
    let previousValue = undefined as JsValue | undefined;
    let hadPreviousValue = false;
    const previousKeys = Object.keys(previous);
    for (
      let previousIndex = 0;
      previousIndex < previousKeys.length;
      previousIndex++
    ) {
      if (previousKeys[previousIndex] === key) {
        previousValue = previous[key];
        hadPreviousValue = true;
        break;
      }
    }
    if (hadPreviousValue && previousValue === result[key]) {
      continue;
    }
    dispatchEventToTenant(user.tenantId, {
      type: "realm_user_settings_defaults",
      op: "update",
      data: {
        property: key,
        value: result[key],
      },
    });
  }

  return ok(result);
};
