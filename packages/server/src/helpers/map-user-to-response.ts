import type { User } from "@jotster/core/Jotster.Core.js";

export const mapUserToResponse = (u: User): Record<string, unknown> => {
  const resp: Record<string, unknown> = {};
  resp["user_id"] = u.Id;
  resp["email"] = u.Email;
  resp["full_name"] = u.FullName;
  resp["role"] = u.Role;
  resp["avatar_url"] = u.AvatarUrl ?? null;
  resp["avatar_source"] = u.AvatarSource;
  resp["is_bot"] = u.IsBot === 1;
  resp["bot_type"] = u.BotType ?? null;
  resp["bot_owner_id"] = u.BotOwnerId ?? null;
  resp["is_active"] = u.IsActive === 1;
  resp["timezone"] = u.Timezone;
  resp["date_joined"] = u.DateJoined;
  resp["is_billing_admin"] = u.IsBillingAdmin === 1;
  resp["delivery_email"] = u.DeliveryEmail;
  return resp;
};
