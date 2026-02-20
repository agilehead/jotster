import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getCustomProfileFieldById } from "../repo/get-custom-profile-field-by-id.ts";
import { setCustomProfileFieldValue } from "../repo/set-custom-profile-field-value.ts";
import { getCustomProfileFieldValues } from "../repo/get-custom-profile-field-values.ts";

export const updateProfileDataDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  profileData: Record<string, { value: string }>
): Promise<Result<boolean, string>> => {
  const fieldIds = Object.keys(profileData);

  if (fieldIds.length === 0) {
    return err("No profile data provided");
  }

  // Validate all fields exist and set values
  for (let i = 0; i < fieldIds.length; i++) {
    const fieldId = fieldIds[i];
    const field = await getCustomProfileFieldById(options, actingUser.tenantId, fieldId);
    if (field === undefined) {
      return err("Custom profile field not found: " + fieldId);
    }

    const entry = profileData[fieldId];
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
  for (let i = 0; i < allValues.Length; i++) {
    const v = allValues[i];
    const valObj: Record<string, unknown> = {};
    valObj["value"] = v.Value;
    valObj["rendered_value"] = v.RenderedValue;
    profileDataResponse[v.FieldId] = valObj;
  }

  dispatchEventToTenant(actingUser.tenantId, {
    type: "realm_user",
    op: "update",
    data: {
      person: {
        user_id: actingUser.userId,
        custom_profile_field: profileDataResponse,
      },
    },
  });

  return ok(true);
};
