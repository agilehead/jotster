import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import { List, Dictionary } from "@tsonic/dotnet/System.Collections.Generic.js";

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

    const readMessageIds = new Set<string>();
    for (let i = 0; i < readFlags.Length; i++) {
      readMessageIds.add(readFlags[i].MessageId);
    }

    // Get subscribed channel IDs for this user
    const subscriptions = await db0.Subscriptions
      .Where((s) => s.TenantId === tenantId0).Where((s) => s.UserId === userId0)
      .ToArrayAsync();

    // Collect unread channel messages
    const channelUnreadMap = new Dictionary<string, ChannelUnread>();
    for (let i = 0; i < subscriptions.Length; i++) {
      const channelId0 = subscriptions[i].ChannelId;
      const streamType = "stream";
      const channelMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.ChannelId === channelId0).Where((m) => m.Type === streamType)
        .ToArrayAsync();

      for (let j = 0; j < channelMessages.Length; j++) {
        const msg = channelMessages[j];
        if (!readMessageIds.has(msg.Id)) {
          const key = msg.ChannelId! + ":" + (msg.Topic ?? "");
          if (!channelUnreadMap.ContainsKey(key)) {
            channelUnreadMap[key] = {
              channelId: msg.ChannelId!,
              topic: msg.Topic ?? "",
              unreadMessageIds: [],
            };
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
    const dmUnreadMap = new Dictionary<string, DmUnread>();
    for (let i = 0; i < dmMemberships.Length; i++) {
      const dmGroupId0 = dmMemberships[i].DmGroupId;
      const directType = "direct";
      const dmMessages = await db0.Messages
        .Where((m) => m.TenantId === tenantId0).Where((m) => m.DmGroupId === dmGroupId0).Where((m) => m.Type === directType)
        .ToArrayAsync();

      for (let j = 0; j < dmMessages.Length; j++) {
        const msg = dmMessages[j];
        if (!readMessageIds.has(msg.Id)) {
          if (!dmUnreadMap.ContainsKey(msg.DmGroupId!)) {
            dmUnreadMap[msg.DmGroupId!] = {
              dmGroupId: msg.DmGroupId!,
              unreadMessageIds: [],
            };
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
    for (let i = 0; i < mentionFlags.Length; i++) {
      const mentionMsgId = mentionFlags[i].MessageId;
      if (!readMessageIds.has(mentionMsgId)) {
        mentions.Add(mentionMsgId);
      }
    }

    // Build result arrays from maps
    const channelUnreads = new List<ChannelUnread>();
    const channelKeys = channelUnreadMap.Keys;
    for (let i = 0; i < channelKeys.Length; i++) {
      channelUnreads.Add(channelUnreadMap[channelKeys[i]]);
    }

    const dmUnreads = new List<DmUnread>();
    const dmKeys = dmUnreadMap.Keys;
    for (let i = 0; i < dmKeys.Length; i++) {
      dmUnreads.Add(dmUnreadMap[dmKeys[i]]);
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
