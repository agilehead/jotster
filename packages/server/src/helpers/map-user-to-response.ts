import type { User } from "@jotster/core/Jotster.Core.js";

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
  resp["profile_data"] = {};
  return resp;
};
