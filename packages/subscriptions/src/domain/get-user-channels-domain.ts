import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getSubscriptionsForUser } from "../repo/get-subscriptions-for-user.ts";
import { getSubscriptionsForChannel } from "../repo/get-subscriptions-for-channel.ts";

export const getUserChannelsDomain = async (
  options: DbContextOptions,
  actingUser: AuthenticatedUser,
  targetUserId: long,
  includeSubscribers: boolean,
): Promise<Result<Record<string, JsValue>[], string>> => {
  // Must be admin or self (role <= 200 or actingUser.userId === targetUserId)
  if (actingUser.role > 200 && actingUser.userId !== targetUserId) {
    return err("Insufficient permission");
  }

  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = actingUser.tenantId;
    const targetUserId0 = targetUserId;

    // Verify target user exists
    const targetUser = await db0.Users.Where((u) => u.TenantId === tenantId0)
      .Where((u) => u.Id === targetUserId0)
      .FirstOrDefaultAsync();

    if (targetUser === undefined || targetUser === null) {
      return err("User not found");
    }

    // Get subscriptions for target user
    const subscriptions = await getSubscriptionsForUser(
      options,
      actingUser.tenantId,
      targetUserId,
    );
    const result = new List<Record<string, JsValue>>();

    for (let i = 0; i < subscriptions.Count; i++) {
      const sub = subscriptions[i];
      const channelId0 = sub.ChannelId;

      const channel = await db0.Channels.Where((c) => c.TenantId === tenantId0)
        .Where((c) => c.Id === channelId0)
        .FirstOrDefaultAsync();

      if (channel === undefined || channel === null) {
        continue;
      }

      const entry: Record<string, JsValue> = {
        stream_id: channel.Id,
        name: channel.Name,
        description: channel.Description,
        rendered_description: channel.RenderedDescription,
        invite_only: channel.IsPrivate === 1,
        is_web_public: channel.IsWebPublic === 1,
        history_public_to_subscribers: channel.HistoryPublicToSubscribers === 1,
        color: sub.Color,
        pin_to_top: sub.PinToTop === 1,
        is_muted: sub.IsMuted === 1,
        desktop_notifications:
          sub.DesktopNotifications !== undefined
            ? sub.DesktopNotifications
            : null,
        push_notifications:
          sub.PushNotifications !== undefined ? sub.PushNotifications : null,
        audible_notifications:
          sub.AudibleNotifications !== undefined
            ? sub.AudibleNotifications
            : null,
        email_notifications:
          sub.EmailNotifications !== undefined ? sub.EmailNotifications : null,
        wildcard_mentions_notify:
          sub.WildcardMentionsNotify !== undefined
            ? sub.WildcardMentionsNotify
            : null,
        date_created: channel.CreatedAt,
        creator_id: channel.CreatorId !== undefined ? channel.CreatorId : null,
      };

      if (includeSubscribers) {
        const channelSubs = await getSubscriptionsForChannel(
          options,
          actingUser.tenantId,
          channel.Id,
        );
        const subscriberList = new List<long>();
        for (let j = 0; j < channelSubs.Count; j++) {
          const channelSub = channelSubs[j];
          subscriberList.Add(channelSub.UserId);
        }
        entry["subscribers"] = subscriberList.ToArray();
      }

      result.Add(entry);
    }

    return ok(result.ToArray());
  } finally {
    db.Dispose();
  }
};
