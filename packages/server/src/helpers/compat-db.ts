import type { int, long } from "@tsonic/core/types.js";
import { Convert, DateTimeOffset } from "@tsonic/dotnet/System.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import {
  ApiKey,
  ChannelFolder,
  ClientDevice,
  JotsterDbContext,
  generateId,
  NavigationView,
  Linkifier,
  Reminder,
  SavedSnippet,
  ScheduledMessage,
  User,
  UserGroup,
} from "@jotster/core/Jotster.Core.js";
import { renderMarkdownDomain, sendMessage, findOrCreateDmGroup, getMessage } from "@jotster/messages/Jotster.Messages.js";
import { regenerateApiKey } from "@jotster/auth/Jotster.Auth.js";
import { setUserStatus } from "@jotster/presence/Jotster.Presence.js";

const nowMilliseconds = (): long => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

export const listDevelopmentUsers = async (
  options: DbContextOptions,
  tenantId: string,
  realmUrl: string,
): Promise<{ direct_admins: Record<string, unknown>[]; direct_users: Record<string, unknown>[] }> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const users = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.IsActive === (1 as int))
      .ToListAsync();

    const directAdmins = new List<Record<string, unknown>>();
    const directUsers = new List<Record<string, unknown>>();
    for (let i = 0; i < users.Count; i++) {
      const user = users[i];
      if (user.IsBot === (1 as int)) {
        continue;
      }

      const payload: Record<string, unknown> = {
        email: user.Email,
        realm_url: realmUrl,
      };

      if (user.Role <= (200 as int)) {
        directAdmins.Add(payload);
      } else {
        directUsers.Add(payload);
      }
    }

    return { direct_admins: directAdmins.ToArray(), direct_users: directUsers.ToArray() };
  } finally {
    db.Dispose();
  }
};

export const resolveUserByEmailPath = async (
  options: DbContextOptions,
  tenantId: string,
  email: string,
): Promise<User | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const email0 = email;

    let user = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Email === email0 || entry.DeliveryEmail === email0)
      .FirstOrDefaultAsync();
    if (user !== undefined && user !== null) {
      return user;
    }

    const atIndex = email.indexOf("@");
    if (!email.startsWith("user") || atIndex <= 4) {
      return undefined;
    }

    const dummyId = email.substring(4, atIndex);
    if (dummyId.length === 0) {
      return undefined;
    }

    user = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === dummyId)
      .FirstOrDefaultAsync();

    return user ?? undefined;
  } finally {
    db.Dispose();
  }
};

export const setTargetUserStatus = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  statusText?: string,
  emojiName?: string,
  emojiCode?: string,
  reactionType?: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const userId0 = userId;
    const user = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === userId0)
      .FirstOrDefaultAsync();
    if (user === undefined || user === null) {
      return false;
    }
  } finally {
    db.Dispose();
  }

  await setUserStatus(options, tenantId, userId, statusText ?? "", emojiName, emojiCode, reactionType);
  return true;
};

const getActiveApiKey = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
): Promise<ApiKey | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const userId0 = userId;
    const apiKey = await db.ApiKeys
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.UserId === userId0)
      .Where((entry) => entry.RevokedAt === undefined)
      .OrderByDescending((entry) => entry.CreatedAt)
      .FirstOrDefaultAsync();
    return apiKey ?? undefined;
  } finally {
    db.Dispose();
  }
};

export const getBotApiKeyForRequester = async (
  options: DbContextOptions,
  requester: AuthenticatedUser,
  botId: string,
): Promise<{ apiKey?: string; error?: string }> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = requester.tenantId;
    const botId0 = botId;
    const bot = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === botId0)
      .FirstOrDefaultAsync();

    if (bot === undefined || bot === null || bot.IsBot !== (1 as int)) {
      return { error: "No such bot" };
    }

    const isOwner = bot.BotOwnerId === requester.userId;
    const isAdmin = requester.role <= (200 as int);
    if (!isOwner && !isAdmin) {
      return { error: "Insufficient permission" };
    }
  } finally {
    db.Dispose();
  }

  const activeApiKey = await getActiveApiKey(options, requester.tenantId, botId);
  if (activeApiKey?.RawKey !== undefined && activeApiKey.RawKey !== null && activeApiKey.RawKey !== "") {
    return { apiKey: activeApiKey.RawKey };
  }

  const regenerated = await regenerateApiKey(options, requester.tenantId, botId);
  if (!regenerated.success) {
    return { error: regenerated.error };
  }

  return { apiKey: regenerated.data.api_key };
};

export const regenerateBotApiKeyForRequester = async (
  options: DbContextOptions,
  requester: AuthenticatedUser,
  botId: string,
): Promise<{ apiKey?: string; error?: string }> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = requester.tenantId;
    const botId0 = botId;
    const bot = await db.Users
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === botId0)
      .FirstOrDefaultAsync();

    if (bot === undefined || bot === null || bot.IsBot !== (1 as int)) {
      return { error: "No such bot" };
    }

    const isOwner = bot.BotOwnerId === requester.userId;
    const isAdmin = requester.role <= (200 as int);
    if (!isOwner && !isAdmin) {
      return { error: "Insufficient permission" };
    }
  } finally {
    db.Dispose();
  }

  const regenerated = await regenerateApiKey(options, requester.tenantId, botId);
  if (!regenerated.success) {
    return { error: regenerated.error };
  }

  return { apiKey: regenerated.data.api_key };
};

export const reorderChannelFolders = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  orderedIds: string[],
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = user.tenantId;
    const folders = await db.ChannelFolders
      .Where((entry) => entry.TenantId === tenantId0)
      .ToListAsync();

    if (folders.Count !== orderedIds.length) {
      return false;
    }

    for (let i = 0; i < folders.Count; i++) {
      if (!containsId(orderedIds, folders[i].Id)) {
        return false;
      }
    }

    const now = nowMilliseconds();
    for (let i = 0; i < orderedIds.length; i++) {
      const folderId = orderedIds[i];
      for (let j = 0; j < folders.Count; j++) {
        if (folders[j].Id === folderId) {
          folders[j].Ordering = Convert.ToInt32(i);
          folders[j].UpdatedAt = now;
          break;
        }
      }
    }

    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const getStreamEmailAddress = async (
  options: DbContextOptions,
  tenantId: string,
  streamId: string,
): Promise<string | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const streamId0 = streamId;
    const tenant = await db.Tenants
      .Where((entry) => entry.Id === tenantId0)
      .FirstOrDefaultAsync();
    const channel = await db.Channels
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === streamId0)
      .FirstOrDefaultAsync();

    if (tenant === undefined || tenant === null || channel === undefined || channel === null) {
      return undefined;
    }

    return `channel-${channel.Id}@${tenant.Subdomain}.jotster.local`;
  } finally {
    db.Dispose();
  }
};

export const deleteTopicMessages = async (
  options: DbContextOptions,
  tenantId: string,
  streamId: string,
  topic: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const streamId0 = streamId;
    const topic0 = topic;

    const channel = await db.Channels
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === streamId0)
      .FirstOrDefaultAsync();
    if (channel === undefined || channel === null) {
      return false;
    }

    const messages = await db.Messages
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.ChannelId === streamId0)
      .Where((entry) => entry.Topic === topic0)
      .ToListAsync();

    for (let i = 0; i < messages.Count; i++) {
      const message = messages[i];
      const messageId0 = message.Id;

      const flags = await db.MessageFlags
        .Where((entry) => entry.MessageId === messageId0)
        .ToListAsync();
      for (let j = 0; j < flags.Count; j++) {
        db.MessageFlags.Remove(flags[j]);
      }

      const reactions = await db.Reactions
        .Where((entry) => entry.MessageId === messageId0)
        .ToListAsync();
      for (let j = 0; j < reactions.Count; j++) {
        db.Reactions.Remove(reactions[j]);
      }

      const histories = await db.MessageEditHistories
        .Where((entry) => entry.MessageId === messageId0)
        .ToListAsync();
      for (let j = 0; j < histories.Count; j++) {
        db.MessageEditHistories.Remove(histories[j]);
      }

      const attachmentLinks = await db.AttachmentMessages
        .Where((entry) => entry.MessageId === messageId0)
        .ToListAsync();
      for (let j = 0; j < attachmentLinks.Count; j++) {
        db.AttachmentMessages.Remove(attachmentLinks[j]);
      }

      db.Messages.Remove(message);
    }

    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const reorderCustomProfileFields = async (
  options: DbContextOptions,
  tenantId: string,
  orderedIds: string[],
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const fields = await db.CustomProfileFields
      .Where((entry) => entry.TenantId === tenantId0)
      .ToListAsync();

    if (fields.Count !== orderedIds.length) {
      return false;
    }

    for (let i = 0; i < fields.Count; i++) {
      if (!containsId(orderedIds, fields[i].Id)) {
        return false;
      }
    }

    for (let i = 0; i < orderedIds.length; i++) {
      for (let j = 0; j < fields.Count; j++) {
        if (fields[j].Id === orderedIds[i]) {
          fields[j].Ordering = Convert.ToInt32(i);
          break;
        }
      }
    }

    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const registerClientDevice = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<string> => {
  const db = new JotsterDbContext(options);
  try {
    const device = new ClientDevice();
    device.Id = generateId();
    device.TenantId = user.tenantId;
    device.UserId = user.userId;
    device.CreatedAt = nowMilliseconds();
    db.ClientDevices.Add(device);
    await db.SaveChangesAsync();
    return device.Id;
  } finally {
    db.Dispose();
  }
};

export const removeClientDevice = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  deviceId: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = user.tenantId;
    const userId0 = user.userId;
    const deviceId0 = deviceId;
    const device = await db.ClientDevices
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.UserId === userId0)
      .Where((entry) => entry.Id === deviceId0)
      .FirstOrDefaultAsync();

    if (device === undefined || device === null) {
      return false;
    }

    db.ClientDevices.Remove(device);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const getUserGroupMembershipStatus = async (
  options: DbContextOptions,
  tenantId: string,
  groupId: string,
  userId: string,
  directOnly: boolean,
): Promise<boolean | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const group = await getUserGroupForTenant(db, tenantId, groupId);
    if (group === undefined) {
      return undefined;
    }

    const user = await getTenantUser(db, tenantId, userId);
    if (user === undefined) {
      return undefined;
    }
    if (user.IsActive !== (1 as int)) {
      return false;
    }

    const members = await getUserGroupMembersCompatInternal(db, tenantId, groupId, directOnly);
    for (let i = 0; i < members.length; i++) {
      if (members[i] === userId) {
        return true;
      }
    }
    return false;
  } finally {
    db.Dispose();
  }
};

const getUserGroupForTenant = async (
  db: JotsterDbContext,
  tenantId: string,
  groupId: string,
): Promise<UserGroup | undefined> => {
  const tenantId0 = tenantId;
  const groupId0 = groupId;
  const group = await db.UserGroups
    .Where((entry) => entry.TenantId === tenantId0)
    .Where((entry) => entry.Id === groupId0)
    .FirstOrDefaultAsync();
  return group ?? undefined;
};

const getTenantUser = async (
  db: JotsterDbContext,
  tenantId: string,
  userId: string,
): Promise<User | undefined> => {
  const tenantId0 = tenantId;
  const userId0 = userId;
  const user = await db.Users
    .Where((entry) => entry.TenantId === tenantId0)
    .Where((entry) => entry.Id === userId0)
    .FirstOrDefaultAsync();
  return user ?? undefined;
};

const getDirectUserGroupMemberIds = async (
  db: JotsterDbContext,
  groupId: string,
): Promise<string[]> => {
  const groupId0 = groupId;
  const memberships = await db.UserGroupMembers
    .Where((entry) => entry.UserGroupId === groupId0)
    .ToListAsync();
  const result = new List<string>();
  for (let i = 0; i < memberships.Count; i++) {
    result.Add(memberships[i].UserId);
  }
  return result.ToArray();
};

const getDirectUserGroupSubgroupIds = async (
  db: JotsterDbContext,
  groupId: string,
): Promise<string[]> => {
  const groupId0 = groupId;
  const subgroups = await db.UserGroupSubgroups
    .Where((entry) => entry.ParentGroupId === groupId0)
    .ToListAsync();
  const result = new List<string>();
  for (let i = 0; i < subgroups.Count; i++) {
    result.Add(subgroups[i].SubgroupId);
  }
  return result.ToArray();
};

const containsId = (values: string[], candidate: string): boolean => {
  for (let i = 0; i < values.length; i++) {
    if (values[i] === candidate) {
      return true;
    }
  }
  return false;
};

const collectNestedUserGroupSubgroupIds = async (
  db: JotsterDbContext,
  groupId: string,
): Promise<string[]> => {
  const seen: string[] = [];
  const pending: string[] = [groupId];
  const result: string[] = [];

  for (let i = 0; i < pending.length; i++) {
    const subgroupIds = await getDirectUserGroupSubgroupIds(db, pending[i]);
    for (let j = 0; j < subgroupIds.length; j++) {
      const subgroupId = subgroupIds[j];
      if (containsId(seen, subgroupId)) {
        continue;
      }
      seen.push(subgroupId);
      result.push(subgroupId);
      pending.push(subgroupId);
    }
  }

  return result;
};

const getUserGroupMembersCompatInternal = async (
  db: JotsterDbContext,
  tenantId: string,
  groupId: string,
  directOnly: boolean,
): Promise<string[]> => {
  const groupIds = new List<string>();
  groupIds.Add(groupId);

  if (!directOnly) {
    const subgroupIds = await collectNestedUserGroupSubgroupIds(db, groupId);
    for (let i = 0; i < subgroupIds.length; i++) {
      groupIds.Add(subgroupIds[i]);
    }
  }

  const seenMembers: string[] = [];
  const result: string[] = [];
  for (let i = 0; i < groupIds.Count; i++) {
    const memberIds = await getDirectUserGroupMemberIds(db, groupIds[i]);
    for (let j = 0; j < memberIds.length; j++) {
      const memberId = memberIds[j];
      if (containsId(seenMembers, memberId)) {
        continue;
      }
      const user = await getTenantUser(db, tenantId, memberId);
      if (user === undefined || user.IsActive !== (1 as int)) {
        continue;
      }
      seenMembers.push(memberId);
      result.push(memberId);
    }
  }

  return result;
};

export const getUserGroupMembersCompat = async (
  options: DbContextOptions,
  tenantId: string,
  groupId: string,
  directOnly: boolean,
): Promise<string[] | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const group = await getUserGroupForTenant(db, tenantId, groupId);
    if (group === undefined) {
      return undefined;
    }
    return await getUserGroupMembersCompatInternal(db, tenantId, groupId, directOnly);
  } finally {
    db.Dispose();
  }
};

export const getUserGroupSubgroupsCompat = async (
  options: DbContextOptions,
  tenantId: string,
  groupId: string,
  directOnly: boolean,
): Promise<string[] | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const group = await getUserGroupForTenant(db, tenantId, groupId);
    if (group === undefined) {
      return undefined;
    }
    if (directOnly) {
      return await getDirectUserGroupSubgroupIds(db, groupId);
    }
    return await collectNestedUserGroupSubgroupIds(db, groupId);
  } finally {
    db.Dispose();
  }
};

export const reportMessageForModeration = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string,
  reportType: string,
  description?: string,
): Promise<{ success: boolean; error?: string }> => {
  if (reportType === "other" && (description === undefined || description.trim().length === 0)) {
    return { success: false, error: "Description is required for report_type=other" };
  }

  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return { success: false, error: "Message not found" };
  }

  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = user.tenantId;
    const tenant = await db.Tenants
      .Where((entry) => entry.Id === tenantId0)
      .FirstOrDefaultAsync();
    if (tenant === undefined || tenant === null) {
      return { success: false, error: "Organization not found" };
    }

    let moderationChannelId: string | undefined;
    try {
      const settings = JSON.parse(tenant.SettingsJson) as Record<string, unknown>;
      if (typeof settings["moderation_request_channel_id"] === "string") {
        moderationChannelId = settings["moderation_request_channel_id"] as string;
      }
    } catch {
      moderationChannelId = undefined;
    }

    if (moderationChannelId === undefined) {
      const fallbackChannel = await db.Channels
        .Where((entry) => entry.TenantId === tenantId0)
        .Where((entry) => entry.Name === "moderation-requests")
        .FirstOrDefaultAsync();
      moderationChannelId = fallbackChannel?.Id;
    }

    if (moderationChannelId === undefined || moderationChannelId === null) {
      return {
        success: false,
        error: "Moderation request channel must be specified to enable message reporting.",
      };
    }
  } finally {
    db.Dispose();
  }

  const renderedReport = renderMarkdownDomain(
    `Reported message ${messageId} for \`${reportType}\`\n\n${description ?? ""}\n\n> ${message.Content}`,
  );
  const reportText = renderedReport.success
    ? `Reported message ${messageId} for ${reportType}\n\n${description ?? ""}\n\n> ${message.Content}`
    : `Reported message ${messageId} for ${reportType}`;

  await sendMessage(options, {
    tenantId: user.tenantId,
    senderId: user.userId,
    type: "stream",
    channelId: await getModerationChannelId(options, user.tenantId),
    topic: "message reports",
    content: reportText,
    renderedContent: renderedReport.success ? renderedReport.data.rendered : `<p>${reportText}</p>`,
  });

  return { success: true };
};

const getModerationChannelId = async (options: DbContextOptions, tenantId: string): Promise<string> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const tenant = await db.Tenants
      .Where((entry) => entry.Id === tenantId0)
      .FirstOrDefaultAsync();
    if (tenant !== undefined && tenant !== null) {
      try {
        const settings = JSON.parse(tenant.SettingsJson) as Record<string, unknown>;
        if (typeof settings["moderation_request_channel_id"] === "string") {
          return settings["moderation_request_channel_id"] as string;
        }
      } catch {
        // Ignore malformed settings.
      }
    }

    const channel = await db.Channels
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Name === "moderation-requests")
      .FirstOrDefaultAsync();
    return channel?.Id ?? "";
  } finally {
    db.Dispose();
  }
};

export const sendWelcomeBotTestMessage = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  text: string,
): Promise<string | undefined> => {
  const rendered = renderMarkdownDomain(text);
  if (!rendered.success) {
    return undefined;
  }

  const dmGroup = await findOrCreateDmGroup(options, user.tenantId, [user.userId]);
  const message = await sendMessage(options, {
    tenantId: user.tenantId,
    senderId: user.userId,
    type: "direct",
    dmGroupId: dmGroup.Id,
    content: text,
    renderedContent: rendered.data.rendered,
  });
  return message.Id;
};

const parseAlternativeUrlTemplates = (value: string | undefined): string[] => {
  if (value === undefined || value.trim().length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const entries = parsed as unknown[];
    const result: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      if (typeof entries[i] === "string") {
        result.push(entries[i] as string);
      }
    }
    return result;
  } catch {
    return [];
  }
};

export const listSavedSnippets = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<SavedSnippet[]> => {
  const db = new JotsterDbContext(options);
  try {
    const snippets = await db.SavedSnippets
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .OrderByDescending((entry) => entry.UpdatedAt)
      .ToArrayAsync();
    return snippets;
  } finally {
    db.Dispose();
  }
};

export const createSavedSnippet = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  title: string,
  content: string,
): Promise<string | undefined> => {
  if (title.trim().length === 0 || content.trim().length === 0) {
    return undefined;
  }

  const db = new JotsterDbContext(options);
  try {
    const now = nowMilliseconds();
    const snippet = new SavedSnippet();
    snippet.Id = generateId();
    snippet.TenantId = user.tenantId;
    snippet.UserId = user.userId;
    snippet.Title = title.trim();
    snippet.Content = content;
    snippet.CreatedAt = now;
    snippet.UpdatedAt = now;
    db.SavedSnippets.Add(snippet);
    await db.SaveChangesAsync();
    return snippet.Id;
  } finally {
    db.Dispose();
  }
};

export const updateSavedSnippet = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  snippetId: string,
  title?: string,
  content?: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const snippetId0 = snippetId;
    const snippet = await db.SavedSnippets
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Id === snippetId0)
      .FirstOrDefaultAsync();
    if (snippet === undefined || snippet === null) {
      return false;
    }

    if (title !== undefined) {
      snippet.Title = title;
    }
    if (content !== undefined) {
      snippet.Content = content;
    }
    snippet.UpdatedAt = nowMilliseconds();
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const deleteSavedSnippet = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  snippetId: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const snippetId0 = snippetId;
    const snippet = await db.SavedSnippets
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Id === snippetId0)
      .FirstOrDefaultAsync();
    if (snippet === undefined || snippet === null) {
      return false;
    }
    db.SavedSnippets.Remove(snippet);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const listNavigationViews = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<NavigationView[]> => {
  const db = new JotsterDbContext(options);
  try {
    const views = await db.NavigationViews
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .OrderBy((entry) => entry.CreatedAt)
      .ToArrayAsync();
    return views;
  } finally {
    db.Dispose();
  }
};

export const createNavigationView = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  fragment: string,
  isPinned: boolean,
  name?: string,
): Promise<boolean> => {
  if (fragment.trim().length === 0) {
    return false;
  }
  const db = new JotsterDbContext(options);
  try {
    const existing = await db.NavigationViews
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Fragment === fragment)
      .FirstOrDefaultAsync();
    if (existing !== undefined && existing !== null) {
      return false;
    }

    const view = new NavigationView();
    const now = nowMilliseconds();
    view.Id = generateId();
    view.TenantId = user.tenantId;
    view.UserId = user.userId;
    view.Fragment = fragment;
    view.IsPinned = isPinned ? (1 as int) : (0 as int);
    view.Name = name;
    view.CreatedAt = now;
    view.UpdatedAt = now;
    db.NavigationViews.Add(view);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const updateNavigationView = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  fragment: string,
  isPinned?: boolean,
  name?: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const fragment0 = fragment;
    const view = await db.NavigationViews
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Fragment === fragment0)
      .FirstOrDefaultAsync();
    if (view === undefined || view === null) {
      return false;
    }
    if (isPinned !== undefined) {
      const pinned = isPinned === true;
      view.IsPinned = pinned ? (1 as int) : (0 as int);
    }
    if (name !== undefined) {
      view.Name = name;
    }
    view.UpdatedAt = nowMilliseconds();
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const deleteNavigationView = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  fragment: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const fragment0 = fragment;
    const view = await db.NavigationViews
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Fragment === fragment0)
      .FirstOrDefaultAsync();
    if (view === undefined || view === null) {
      return false;
    }
    db.NavigationViews.Remove(view);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const listReminders = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<Reminder[]> => {
  const db = new JotsterDbContext(options);
  try {
    const reminders = await db.Reminders
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .OrderBy((entry) => entry.ScheduledDeliveryTimestamp)
      .ToArrayAsync();
    return reminders;
  } finally {
    db.Dispose();
  }
};

export const createReminder = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  messageId: string,
  scheduledDeliveryTimestampSeconds: string,
  note?: string,
): Promise<string | undefined> => {
  const message = await getMessage(options, user.tenantId, messageId);
  if (message === undefined) {
    return undefined;
  }
  const timestamp = Number(scheduledDeliveryTimestampSeconds);
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  const db = new JotsterDbContext(options);
  try {
    const reminder = new Reminder();
    const now = nowMilliseconds();
    reminder.Id = generateId();
    reminder.TenantId = user.tenantId;
    reminder.UserId = user.userId;
    reminder.MessageId = messageId;
    reminder.Note = note;
    reminder.Content = note?.trim().length ? note : message.Content;
    reminder.RenderedContent = note?.trim().length ? `<p>${note}</p>` : message.RenderedContent;
    reminder.ScheduledDeliveryTimestamp = Convert.ToInt64(timestamp * 1000);
    reminder.Failed = 0 as int;
    reminder.CreatedAt = now;
    reminder.UpdatedAt = now;
    db.Reminders.Add(reminder);
    await db.SaveChangesAsync();
    return reminder.Id;
  } finally {
    db.Dispose();
  }
};

export const deleteReminder = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  reminderId: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const reminderId0 = reminderId;
    const reminder = await db.Reminders
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Id === reminderId0)
      .FirstOrDefaultAsync();
    if (reminder === undefined || reminder === null) {
      return false;
    }
    db.Reminders.Remove(reminder);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const listScheduledMessages = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
): Promise<ScheduledMessage[]> => {
  const db = new JotsterDbContext(options);
  try {
    const messages = await db.ScheduledMessages
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .OrderBy((entry) => entry.ScheduledDeliveryTimestamp)
      .ToArrayAsync();
    return messages;
  } finally {
    db.Dispose();
  }
};

export const createScheduledMessage = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  type: string,
  toValueText: string | undefined,
  toValueArray: string[] | undefined,
  content: string,
  topic: string | undefined,
  scheduledDeliveryTimestampSeconds: string,
): Promise<string | undefined> => {
  const normalizedType = type === "channel" ? "stream" : type;
  if (normalizedType !== "stream" && normalizedType !== "direct" && normalizedType !== "private") {
    return undefined;
  }
  const rendered = renderMarkdownDomain(content);
  if (!rendered.success) {
    return undefined;
  }
  const timestamp = Number(scheduledDeliveryTimestampSeconds);
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  const scheduled = new ScheduledMessage();
  const now = nowMilliseconds();
  scheduled.Id = generateId();
  scheduled.TenantId = user.tenantId;
  scheduled.UserId = user.userId;
  scheduled.Type = normalizedType === "private" ? "direct" : normalizedType;
  if (scheduled.Type === "stream") {
    if (toValueText !== undefined) {
      scheduled.ChannelId = toValueText;
    } else {
      scheduled.ChannelId = toValueArray !== undefined && toValueArray.length > 0 ? toValueArray[0] : "";
    }
    scheduled.Topic = topic ?? "";
  } else {
    if (toValueArray !== undefined) {
      scheduled.RecipientIdsJson = JSON.stringify(toValueArray);
    } else if (toValueText !== undefined) {
      scheduled.RecipientIdsJson = toValueText.trim().startsWith("[") ? toValueText : JSON.stringify([toValueText]);
    } else {
      scheduled.RecipientIdsJson = JSON.stringify([]);
    }
  }
  scheduled.Content = content;
  scheduled.RenderedContent = rendered.data.rendered;
  scheduled.ScheduledDeliveryTimestamp = Convert.ToInt64(timestamp * 1000);
  scheduled.Failed = 0 as int;
  scheduled.CreatedAt = now;
  scheduled.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.ScheduledMessages.Add(scheduled);
    await db.SaveChangesAsync();
    return scheduled.Id;
  } finally {
    db.Dispose();
  }
};

export const updateScheduledMessage = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  scheduledMessageId: string,
  type: string | undefined,
  toValueText: string | undefined,
  toValueArray: string[] | undefined,
  content: string | undefined,
  topic: string | undefined,
  scheduledDeliveryTimestampSeconds: string | undefined,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const scheduledMessageId0 = scheduledMessageId;
    const scheduled = await db.ScheduledMessages
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Id === scheduledMessageId0)
      .FirstOrDefaultAsync();
    if (scheduled === undefined || scheduled === null) {
      return false;
    }

    if (type !== undefined) {
      scheduled.Type = type === "channel" ? "stream" : type;
    }
    if (toValueText !== undefined || toValueArray !== undefined) {
      if (scheduled.Type === "stream") {
        if (toValueText !== undefined) {
          scheduled.ChannelId = toValueText;
        } else {
          scheduled.ChannelId = toValueArray !== undefined && toValueArray.length > 0 ? toValueArray[0] : "";
        }
      } else if (toValueArray !== undefined) {
        scheduled.RecipientIdsJson = JSON.stringify(toValueArray);
      } else if (toValueText !== undefined) {
        scheduled.RecipientIdsJson = toValueText.trim().startsWith("[") ? toValueText : JSON.stringify([toValueText]);
      }
    }
    if (content !== undefined) {
      const rendered = renderMarkdownDomain(content);
      if (!rendered.success) {
        return false;
      }
      scheduled.Content = content;
      scheduled.RenderedContent = rendered.data.rendered;
    }
    if (topic !== undefined) {
      scheduled.Topic = topic;
    }
    if (scheduledDeliveryTimestampSeconds !== undefined) {
      const timestamp = Number(scheduledDeliveryTimestampSeconds);
      if (!Number.isFinite(timestamp)) {
        return false;
      }
      scheduled.ScheduledDeliveryTimestamp = Convert.ToInt64(timestamp * 1000);
    }
    scheduled.UpdatedAt = nowMilliseconds();

    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const deleteScheduledMessage = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  scheduledMessageId: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const scheduledMessageId0 = scheduledMessageId;
    const scheduled = await db.ScheduledMessages
      .Where((entry) => entry.TenantId === user.tenantId)
      .Where((entry) => entry.UserId === user.userId)
      .Where((entry) => entry.Id === scheduledMessageId0)
      .FirstOrDefaultAsync();
    if (scheduled === undefined || scheduled === null) {
      return false;
    }
    db.ScheduledMessages.Remove(scheduled);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const listLinkifiers = async (
  options: DbContextOptions,
  tenantId: string,
): Promise<Linkifier[]> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const linkifiers = await db.Linkifiers
      .Where((entry) => entry.TenantId === tenantId0)
      .OrderBy((entry) => entry.Ordering)
      .ToArrayAsync();
    return linkifiers;
  } finally {
    db.Dispose();
  }
};

export const createLinkifier = async (
  options: DbContextOptions,
  tenantId: string,
  pattern: string,
  urlTemplate: string,
  exampleInput?: string,
  reverseTemplate?: string,
  alternativeUrlTemplatesJson?: string,
): Promise<string | undefined> => {
  if (pattern.trim().length === 0 || urlTemplate.trim().length === 0) {
    return undefined;
  }
  const existing = await listLinkifiers(options, tenantId);
  const linkifier = new Linkifier();
  const now = nowMilliseconds();
  linkifier.Id = generateId();
  linkifier.TenantId = tenantId;
  linkifier.Pattern = pattern;
  linkifier.UrlTemplate = urlTemplate;
  linkifier.ExampleInput = exampleInput;
  linkifier.ReverseTemplate = reverseTemplate;
  const templates = parseAlternativeUrlTemplates(alternativeUrlTemplatesJson);
  linkifier.AlternativeUrlTemplatesJson = templates.length > 0 ? JSON.stringify(templates) : undefined;
  linkifier.Ordering = Convert.ToInt32(existing.length);
  linkifier.CreatedAt = now;
  linkifier.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Linkifiers.Add(linkifier);
    await db.SaveChangesAsync();
    return linkifier.Id;
  } finally {
    db.Dispose();
  }
};

export const updateLinkifier = async (
  options: DbContextOptions,
  tenantId: string,
  filterId: string,
  updates: {
    pattern?: string;
    urlTemplate?: string;
    exampleInput?: string;
    reverseTemplate?: string;
    alternativeUrlTemplatesJson?: string;
  },
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const filterId0 = filterId;
    const linkifier = await db.Linkifiers
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === filterId0)
      .FirstOrDefaultAsync();
    if (linkifier === undefined || linkifier === null) {
      return false;
    }

    if (updates.pattern !== undefined) {
      linkifier.Pattern = updates.pattern;
    }
    if (updates.urlTemplate !== undefined) {
      linkifier.UrlTemplate = updates.urlTemplate;
    }
    if (updates.exampleInput !== undefined) {
      linkifier.ExampleInput = updates.exampleInput;
    }
    if (updates.reverseTemplate !== undefined) {
      linkifier.ReverseTemplate = updates.reverseTemplate;
    }
    if (updates.alternativeUrlTemplatesJson !== undefined) {
      const templates = parseAlternativeUrlTemplates(updates.alternativeUrlTemplatesJson);
      linkifier.AlternativeUrlTemplatesJson = templates.length > 0 ? JSON.stringify(templates) : undefined;
    }
    linkifier.UpdatedAt = nowMilliseconds();
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const deleteLinkifier = async (
  options: DbContextOptions,
  tenantId: string,
  filterId: string,
): Promise<boolean> => {
  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const filterId0 = filterId;
    const linkifier = await db.Linkifiers
      .Where((entry) => entry.TenantId === tenantId0)
      .Where((entry) => entry.Id === filterId0)
      .FirstOrDefaultAsync();
    if (linkifier === undefined || linkifier === null) {
      return false;
    }
    db.Linkifiers.Remove(linkifier);
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};

export const reorderLinkifiers = async (
  options: DbContextOptions,
  tenantId: string,
  orderedIds: string[],
): Promise<boolean> => {
  const linkifiers = await listLinkifiers(options, tenantId);
  if (linkifiers.length !== orderedIds.length) {
    return false;
  }

  for (let i = 0; i < linkifiers.length; i++) {
    if (!containsId(orderedIds, linkifiers[i].Id)) {
      return false;
    }
  }

  const db = new JotsterDbContext(options);
  try {
    const tenantId0 = tenantId;
    const storedLinkifiers = await db.Linkifiers
      .Where((entry) => entry.TenantId === tenantId0)
      .ToListAsync();
    for (let i = 0; i < orderedIds.length; i++) {
      const orderedId = orderedIds[i];
      for (let j = 0; j < storedLinkifiers.Count; j++) {
        const storedLinkifier = storedLinkifiers[j];
        if (storedLinkifier.Id === orderedId) {
          storedLinkifier.Ordering = Convert.ToInt32(i);
          break;
        }
      }
    }
    await db.SaveChangesAsync();
    return true;
  } finally {
    db.Dispose();
  }
};
