import type { JsValue, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, ok } from "@jotster/core/Jotster.Core.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { getSubscriptionsForUser } from "../repo/get-subscriptions-for-user.ts";
import { getSubscriptionsForChannel } from "../repo/get-subscriptions-for-channel.ts";

const toOptionalBoolean = (value: number | undefined): boolean | null => {
  if (value === undefined) {
    return null;
  }
  return value === 1;
};

export const getSubscriptionsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  includeSubscribers: boolean,
): Promise<Result<Record<string, JsValue>[], string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;

    const subscriptions = await getSubscriptionsForUser(
      options,
      user.tenantId,
      user.userId,
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
        date_created: channel.CreatedAt,
        creator_id: channel.CreatorId !== undefined ? channel.CreatorId : null,
        invite_only: channel.IsPrivate === 1,
        stream_post_policy: 1,
        is_announcement_only: false,
        is_web_public: channel.IsWebPublic === 1,
        history_public_to_subscribers: channel.HistoryPublicToSubscribers === 1,
        color: sub.Color,
        pin_to_top: sub.PinToTop === 1,
        is_muted: sub.IsMuted === 1,
        in_home_view: sub.IsMuted !== 1,
        desktop_notifications: toOptionalBoolean(sub.DesktopNotifications),
        push_notifications: toOptionalBoolean(sub.PushNotifications),
        audible_notifications: toOptionalBoolean(sub.AudibleNotifications),
        email_notifications: toOptionalBoolean(sub.EmailNotifications),
        wildcard_mentions_notify: toOptionalBoolean(sub.WildcardMentionsNotify),
        first_message_id:
          channel.FirstMessageId !== undefined ? channel.FirstMessageId : null,
        message_retention_days:
          channel.MessageRetentionDays !== undefined
            ? channel.MessageRetentionDays
            : null,
        is_archived: channel.IsArchived === 1,
      };

      if (includeSubscribers) {
        const channelSubs = await getSubscriptionsForChannel(
          options,
          user.tenantId,
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
