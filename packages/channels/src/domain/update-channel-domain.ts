import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { Channel, ok, err, MAX_CHANNEL_NAME_LENGTH } from "@jotster/core/Jotster.Core.js";
import { getChannelById } from "../repo/get-channel-by-id.ts";
import { getChannelByName } from "../repo/get-channel-by-name.ts";
import { updateChannel } from "../repo/update-channel.ts";

interface UpdateChannelDomainInput {
  name?: string;
  description?: string;
  isPrivate?: int;
  isWebPublic?: int;
  historyPublicToSubscribers?: int;
  messageRetentionDays?: int;
}

export const updateChannelDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  channelId: string,
  updates: UpdateChannelDomainInput
): Promise<Result<Channel, string>> => {
  const channel = await getChannelById(options, channelId);
  if (channel === undefined) {
    return err("Channel not found");
  }

  const one = 1 as int;
  if (channel.IsArchived === one) {
    return err("Channel is archived");
  }

  // Admin or creator required
  if (user.role > 200 && channel.CreatorId !== user.userId) {
    return err("Insufficient permission");
  }

  // Validate name if changing
  let renderedDescription: string | undefined = undefined;

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    if (name.length === 0) {
      return err("Channel name must not be empty");
    }
    if (name.length > MAX_CHANNEL_NAME_LENGTH) {
      return err("Channel name too long");
    }
    if (name.includes("\n")) {
      return err("Channel name must not contain newlines");
    }
    if (name !== channel.Name) {
      const existing = await getChannelByName(options, user.tenantId, name);
      if (existing !== undefined) {
        return err("Channel name already in use");
      }
    }
  }

  // If description changes, set renderedDescription to the same value for now
  if (updates.description !== undefined) {
    renderedDescription = updates.description;
  }

  const updated = await updateChannel(options, channelId, {
    name: updates.name !== undefined ? updates.name.trim() : undefined,
    description: updates.description,
    renderedDescription,
    isPrivate: updates.isPrivate,
    isWebPublic: updates.isWebPublic,
    historyPublicToSubscribers: updates.historyPublicToSubscribers,
    messageRetentionDays: updates.messageRetentionDays,
  });

  if (updated === undefined) {
    return err("Channel not found");
  }

  return ok(updated);
};
