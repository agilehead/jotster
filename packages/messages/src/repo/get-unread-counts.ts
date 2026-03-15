import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

interface ChannelUnread {
  channelId: long;
  topic: string;
  unreadMessageIds: long[];
}

interface DmUnread {
  dmGroupId: string;
  unreadMessageIds: long[];
}

interface UnreadCounts {
  channelUnreads: ChannelUnread[];
  dmUnreads: DmUnread[];
  mentions: long[];
  count: int;
}

export const getUnreadCounts = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<UnreadCounts> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const userId0 = userId;
    const readFlag = "read";
    const starFlag = "mentioned";

    // Get all "read" flags for this user to know which messages are read
    const readFlags = await db0.MessageFlags
      .Where((f) => f.UserId === userId0).Where((f) => f.Flag === readFlag)
      .ToListAsync();

    const readMessageIds = new List<long>();
    for (let i = 0; i < readFlags.Count; i++) {
      const readFlagEntry = readFlags[i];
      readMessageIds.Add(readFlagEntry.MessageId);
    }

    // Get subscribed channel IDs for this user
    const subscriptions = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .ToListAsync();

    // Collect unread channel messages
    const channelUnreadMap: Record<string, ChannelUnread> = {};
    const channelUnreadMapKeys = new List<string>();
    for (let subscriptionIndex = 0; subscriptionIndex < subscriptions.Count; subscriptionIndex++) {
      const subscription = subscriptions[subscriptionIndex];
      const channelId0 = subscription.ChannelId;
      const streamType = "stream";
      const channelMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Type === streamType)
        .ToListAsync();

      for (let channelMessageIndex = 0; channelMessageIndex < channelMessages.Count; channelMessageIndex++) {
        const msg = channelMessages[channelMessageIndex];
        let isRead = false;
        for (let ri = 0; ri < readMessageIds.Count; ri++) {
          if (readMessageIds[ri] === msg.Id) {
            isRead = true;
            break;
          }
        }
        if (!isRead) {
          const msgChannelId = channelId0;
          const key = msgChannelId.toString() + ":" + (msg.Topic ?? "");
          let keyExists = false;
          for (let ki = 0; ki < channelUnreadMapKeys.Count; ki++) {
            if (channelUnreadMapKeys[ki] === key) {
              keyExists = true;
              break;
            }
          }
          if (!keyExists) {
            const emptyIds: long[] = [];
            channelUnreadMap[key] = {
              channelId: msgChannelId,
              topic: msg.Topic ?? "",
              unreadMessageIds: emptyIds,
            };
            channelUnreadMapKeys.Add(key);
          }
          const chUnreadList = new List<long>();
          for (let ci = 0; ci < channelUnreadMap[key].unreadMessageIds.length; ci++) {
            chUnreadList.Add(channelUnreadMap[key].unreadMessageIds[ci]);
          }
          chUnreadList.Add(msg.Id);
          channelUnreadMap[key].unreadMessageIds = chUnreadList.ToArray();
        }
      }
    }

    // Get DM groups for this user
    const dmMemberships = await db0.DmGroupMembers
      .Where((m) => m.UserId === userId0)
      .ToListAsync();

    // Collect unread DM messages
    const dmUnreadMap: Record<string, DmUnread> = {};
    const dmUnreadMapKeys = new List<string>();
    for (let membershipIndex = 0; membershipIndex < dmMemberships.Count; membershipIndex++) {
      const membership = dmMemberships[membershipIndex];
      const dmGroupId0 = membership.DmGroupId;
      const directType = "direct";
      const dmMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.Type === directType)
        .ToListAsync();

      for (let dmMessageIndex = 0; dmMessageIndex < dmMessages.Count; dmMessageIndex++) {
        const msg = dmMessages[dmMessageIndex];
        let isRead = false;
        for (let ri = 0; ri < readMessageIds.Count; ri++) {
          if (readMessageIds[ri] === msg.Id) {
            isRead = true;
            break;
          }
        }
        if (!isRead) {
          let dmKeyExists = false;
          for (let ki = 0; ki < dmUnreadMapKeys.Count; ki++) {
            if (dmUnreadMapKeys[ki] === msg.DmGroupId!) {
              dmKeyExists = true;
              break;
            }
          }
          if (!dmKeyExists) {
            const emptyIds: long[] = [];
            dmUnreadMap[msg.DmGroupId!] = {
              dmGroupId: msg.DmGroupId!,
              unreadMessageIds: emptyIds,
            };
            dmUnreadMapKeys.Add(msg.DmGroupId!);
          }
          const dmUnreadList = new List<long>();
          for (let di = 0; di < dmUnreadMap[msg.DmGroupId!].unreadMessageIds.length; di++) {
            dmUnreadList.Add(dmUnreadMap[msg.DmGroupId!].unreadMessageIds[di]);
          }
          dmUnreadList.Add(msg.Id);
          dmUnreadMap[msg.DmGroupId!].unreadMessageIds = dmUnreadList.ToArray();
        }
      }
    }

    // Get mentions (messages flagged as "mentioned" for this user)
    const mentionFlags = await db0.MessageFlags
      .Where((f) => f.UserId === userId0).Where((f) => f.Flag === starFlag)
      .ToListAsync();

    const mentions = new List<long>();
    for (let mentionIndex = 0; mentionIndex < mentionFlags.Count; mentionIndex++) {
      const mentionFlag = mentionFlags[mentionIndex];
      const mentionMsgId = mentionFlag.MessageId;
      let isMentionRead = false;
      for (let ri = 0; ri < readMessageIds.Count; ri++) {
        if (readMessageIds[ri] === mentionMsgId) {
          isMentionRead = true;
          break;
        }
      }
      if (!isMentionRead) {
        mentions.Add(mentionMsgId);
      }
    }

    // Build result arrays from maps
    const channelUnreads = new List<ChannelUnread>();
    for (let i = 0; i < channelUnreadMapKeys.Count; i++) {
      channelUnreads.Add(channelUnreadMap[channelUnreadMapKeys[i]]);
    }

    const dmUnreads = new List<DmUnread>();
    for (let i = 0; i < dmUnreadMapKeys.Count; i++) {
      dmUnreads.Add(dmUnreadMap[dmUnreadMapKeys[i]]);
    }

    // Count total unread
    let totalCount = 0;
    for (let i = 0; i < channelUnreads.Count; i++) {
      totalCount = totalCount + channelUnreads[i].unreadMessageIds.length;
    }
    for (let i = 0; i < dmUnreads.Count; i++) {
      totalCount = totalCount + dmUnreads[i].unreadMessageIds.length;
    }

    return {
      channelUnreads: channelUnreads.ToArray(),
      dmUnreads: dmUnreads.ToArray(),
      mentions: mentions.ToArray(),
      count: totalCount as int,
    };
  } finally {
    db.Dispose();
  }
};
