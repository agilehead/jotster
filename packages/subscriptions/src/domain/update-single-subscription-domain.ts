import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { getSubscription } from "../repo/get-subscription.ts";
import { updateSubscriptionProperty } from "../repo/update-subscription-property.ts";

const VALID_PROPERTIES = [
  "color",
  "pin_to_top",
  "is_muted",
  "desktop_notifications",
  "push_notifications",
  "audible_notifications",
  "email_notifications",
  "wildcard_mentions_notify",
];

export const updateSingleSubscriptionDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: long,
  property: string,
  value: unknown,
): Promise<Result<boolean, string>> => {
  // Find subscription by tenantId + userId + channelId
  const sub = await getSubscription(
    options,
    user.tenantId,
    user.userId,
    channelId,
  );
  if (sub === undefined) {
    return err("Not subscribed to channel");
  }

  // Validate property name
  let valid = false;
  for (let i = 0; i < VALID_PROPERTIES.length; i++) {
    if (VALID_PROPERTIES[i] === property) {
      valid = true;
      break;
    }
  }
  if (!valid) {
    return err("Unknown property: " + property);
  }

  // Apply update via repo
  await updateSubscriptionProperty(options, sub.Id, property, value);
  return ok(true);
};
