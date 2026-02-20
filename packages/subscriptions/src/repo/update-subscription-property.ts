import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Subscription } from "@jotster/core/Jotster.Core.js";

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
        sub.PinToTop = value as int;
        break;
      case "is_muted":
        sub.IsMuted = value as int;
        break;
      case "desktop_notifications":
        sub.DesktopNotifications = value as int;
        break;
      case "push_notifications":
        sub.PushNotifications = value as int;
        break;
      case "audible_notifications":
        sub.AudibleNotifications = value as int;
        break;
      case "email_notifications":
        sub.EmailNotifications = value as int;
        break;
      case "wildcard_mentions_notify":
        sub.WildcardMentionsNotify = value as int;
        break;
    }

    await db0.SaveChangesAsync();
    return sub;
  } finally {
    db.Dispose();
  }
};
