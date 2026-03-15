import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { getSubscription } from "../repo/get-subscription.ts";
import { updateSubscriptionProperty } from "../repo/update-subscription-property.ts";

interface SubscriptionPropertyUpdate {
  streamId: long;
  property: string;
  propValue: string;
}

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

export const updateSubscriptionPropertiesDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  updates: SubscriptionPropertyUpdate[],
): Promise<Result<boolean, string>> => {
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];

    // Find subscription by user.tenantId + user.userId + streamId (as channelId)
    const sub = await getSubscription(
      options,
      user.tenantId,
      user.userId,
      update.streamId,
    );
    if (sub === undefined) {
      return err("Not subscribed to channel");
    }

    // Validate property name
    let valid = false;
    for (let j = 0; j < VALID_PROPERTIES.length; j++) {
      if (VALID_PROPERTIES[j] === update.property) {
        valid = true;
        break;
      }
    }
    if (!valid) {
      return err("Unknown property: " + update.property);
    }

    // Apply update via repo
    await updateSubscriptionProperty(
      options,
      sub.Id,
      update.property,
      update.propValue,
    );
  }

  return ok(true);
};
