import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFieldById } from "../repo/get-custom-profile-field-by-id.ts";
import { setCustomProfileFieldValue } from "../repo/set-custom-profile-field-value.ts";
import { getCustomProfileFieldValues } from "../repo/get-custom-profile-field-values.ts";

export const updateProfileDataDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  profileData: Record<string, { value: string }>,
  profileDataKeys: List<string>
): Promise<Result<boolean, string>> => {
  if (profileDataKeys.Count === 0) {
    return err("No profile data provided");
  }

  // Validate all fields exist and set values
  for (let i = 0; i < profileDataKeys.Count; i++) {
    const fieldIdStr = profileDataKeys[i];
    const fieldId = Convert.ToInt64(parseInt(fieldIdStr, 10));
    const field = await getCustomProfileFieldById(options, actingUser.tenantId, fieldId);
    if (field === undefined) {
      return err("Custom profile field not found: " + fieldIdStr);
    }

    const entry = profileData[fieldIdStr];
    await setCustomProfileFieldValue(
      options,
      actingUser.tenantId,
      actingUser.userId,
      fieldId,
      entry.value
    );
  }

  // Build profile_data for event
  const allValues = await getCustomProfileFieldValues(options, actingUser.tenantId, actingUser.userId);
  const profileDataResponse: Record<string, unknown> = {};
  for (let i = 0; i < allValues.length; i++) {
    const v = allValues[i];
    const valObj: Record<string, unknown> = {};
    valObj["value"] = v.Value;
    valObj["rendered_value"] = v.RenderedValue;
    profileDataResponse["" + v.FieldId] = valObj;
  }

  const personData: Record<string, unknown> = {};
  personData["user_id"] = actingUser.userId;
  personData["custom_profile_field"] = profileDataResponse;

  const eventData: Record<string, unknown> = {};
  eventData["person"] = personData;

  dispatchEventToTenant(actingUser.tenantId, {
    type: "realm_user",
    op: "update",
    data: eventData,
  });

  return ok(true);
};
