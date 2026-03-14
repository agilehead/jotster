import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Subscription } from "@jotster/core/Jotster.Core.js";

const toOptionalFlagInt = (value: unknown): int | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value === true || value === "true" || value === 1 || value === "1") {
    return 1 as int;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return 0 as int;
  }
  return undefined;
};

export const updateSubscriptionProperty = async (
  options: DbContextOptions,
  subscriptionId: string,
  property: string,
  value: unknown
): Promise<Subscription | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const subscriptionId0 = subscriptionId;
    const sub = await db0.Subscriptions
      .Where((s) => s.Id === subscriptionId0)
      .FirstOrDefaultAsync();
    if (sub === undefined || sub === null) {
      return undefined;
    }

    switch (property) {
      case "color":
        sub.Color = value as string;
        break;
      case "pin_to_top":
        sub.PinToTop = toOptionalFlagInt(value) ?? (0 as int);
        break;
      case "is_muted":
        sub.IsMuted = toOptionalFlagInt(value) ?? (0 as int);
        break;
      case "desktop_notifications":
        sub.DesktopNotifications = toOptionalFlagInt(value);
        break;
      case "push_notifications":
        sub.PushNotifications = toOptionalFlagInt(value);
        break;
      case "audible_notifications":
        sub.AudibleNotifications = toOptionalFlagInt(value);
        break;
      case "email_notifications":
        sub.EmailNotifications = toOptionalFlagInt(value);
        break;
      case "wildcard_mentions_notify":
        sub.WildcardMentionsNotify = toOptionalFlagInt(value);
        break;
    }

    await db0.SaveChangesAsync();
    return sub;
  } finally {
    db.Dispose();
  }
};
