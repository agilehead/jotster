import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";

interface ChannelUnread {
  channelId: string;
  topic: string;
  unreadMessageIds: string[];
}

interface DmUnread {
  dmGroupId: string;
  unreadMessageIds: string[];
}

interface UnreadCounts {
  channelUnreads: ChannelUnread[];
  dmUnreads: DmUnread[];
  mentions: string[];
  count: int;
}

export const getUnreadCounts = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
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
      .ToArrayAsync();

    const readMessageIds = new List<string>();
    for (let i = 0; i < readFlags.length; i++) {
      readMessageIds.Add(readFlags[i].MessageId);
    }

    // Get subscribed channel IDs for this user
    const subscriptions = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .ToArrayAsync();

    // Collect unread channel messages
    const channelUnreadMap: Record<string, ChannelUnread> = {};
    const channelUnreadMapKeys = new List<string>();
    for (let i = 0; i < subscriptions.length; i++) {
      const channelId0 = subscriptions[i].ChannelId;
      const streamType = "stream";
      const channelMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Type === streamType)
        .ToArrayAsync();

      for (let j = 0; j < channelMessages.length; j++) {
        const msg = channelMessages[j];
        let isRead = false;
        for (let ri = 0; ri < readMessageIds.Count; ri++) {
          if (readMessageIds[ri] === msg.Id) {
            isRead = true;
            break;
          }
        }
        if (!isRead) {
          const key = msg.ChannelId! + ":" + (msg.Topic ?? "");
          let keyExists = false;
          for (let ki = 0; ki < channelUnreadMapKeys.Count; ki++) {
            if (channelUnreadMapKeys[ki] === key) {
              keyExists = true;
              break;
            }
          }
          if (!keyExists) {
            const emptyIds: string[] = [];
            channelUnreadMap[key] = {
              channelId: msg.ChannelId!,
              topic: msg.Topic ?? "",
              unreadMessageIds: emptyIds,
            };
            channelUnreadMapKeys.Add(key);
          }
          const chUnreadList = new List<string>();
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
      .ToArrayAsync();

    // Collect unread DM messages
    const dmUnreadMap: Record<string, DmUnread> = {};
    const dmUnreadMapKeys = new List<string>();
    for (let i = 0; i < dmMemberships.length; i++) {
      const dmGroupId0 = dmMemberships[i].DmGroupId;
      const directType = "direct";
      const dmMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.Type === directType)
        .ToArrayAsync();

      for (let j = 0; j < dmMessages.length; j++) {
        const msg = dmMessages[j];
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
            const emptyIds: string[] = [];
            dmUnreadMap[msg.DmGroupId!] = {
              dmGroupId: msg.DmGroupId!,
              unreadMessageIds: emptyIds,
            };
            dmUnreadMapKeys.Add(msg.DmGroupId!);
          }
          const dmUnreadList = new List<string>();
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
      .ToArrayAsync();

    const mentions = new List<string>();
    for (let i = 0; i < mentionFlags.length; i++) {
      const mentionMsgId = mentionFlags[i].MessageId;
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
