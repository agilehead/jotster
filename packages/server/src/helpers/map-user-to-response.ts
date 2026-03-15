import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { User } from "@jotster/core/Jotster.Core.js";
import { getCustomProfileFieldValues } from "@jotster/users/Jotster.Users.js";

export const mapUserToResponse = (u: User): Record<string, unknown> => {
  const resp: Record<string, unknown> = {};
  resp["user_id"] = u.Id;
  resp["delivery_email"] = u.DeliveryEmail;
  resp["email"] = u.Email;
  resp["full_name"] = u.FullName;
  resp["date_joined"] = u.DateJoined;
  resp["is_active"] = u.IsActive === 1;
  resp["is_owner"] = u.Role === 100;
  resp["is_admin"] = u.Role <= 200;
  resp["is_guest"] = u.Role === 600;
  resp["is_bot"] = u.IsBot === 1;
  resp["bot_type"] = u.BotType ?? null;
  resp["bot_owner_id"] = u.BotOwnerId ?? null;
  resp["role"] = u.Role;
  resp["timezone"] = u.Timezone;
  resp["avatar_url"] = u.AvatarUrl ?? null;
  resp["avatar_version"] = 1;
  resp["is_billing_admin"] = u.IsBillingAdmin === 1;
  resp["is_imported_stub"] = false;
  resp["profile_data"] = {};
  return resp;
};

export const buildUserResponse = async (
  options: DbContextOptions,
  u: User,
): Promise<Record<string, unknown>> => {
  const resp = mapUserToResponse(u);
  const values = await getCustomProfileFieldValues(options, u.TenantId, u.Id);
  const profileData: Record<string, unknown> = {};

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const valuePayload: Record<string, unknown> = {
      value: value.Value,
    };
    if (value.RenderedValue !== undefined && value.RenderedValue !== null) {
      valuePayload["rendered_value"] = value.RenderedValue;
    }
    profileData[value.FieldId] = valuePayload;
  }

  resp["profile_data"] = profileData;
  return resp;
};
