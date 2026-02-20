import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import {
  JotsterDbContext,
  Channel,
  Subscription,
  generateId,
  ok,
  err,
  MAX_CHANNEL_NAME_LENGTH,
} from "@jotster/core/Jotster.Core.js";
import { createChannel } from "../repo/create-channel.ts";
import { getChannelByName } from "../repo/get-channel-by-name.ts";

interface CreateChannelDomainInput {
  name: string;
  description?: string;
  isPrivate?: int;
  isWebPublic?: int;
  historyPublicToSubscribers?: int;
  messageRetentionDays?: int;
}

export const createChannelDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  input: CreateChannelDomainInput
): Promise<Result<Channel, string>> => {
  const name = input.name.Trim();

  if (name.Length === 0) {
    return err("Channel name must not be empty");
  }

  if (name.Length > MAX_CHANNEL_NAME_LENGTH) {
    return err("Channel name too long");
  }

  if (name.Contains("\n")) {
    return err("Channel name must not contain newlines");
  }

  const existing = await getChannelByName(options, user.tenantId, name);
  if (existing !== undefined) {
    return err("Channel name already in use");
  }

  const channel = await createChannel(options, {
    tenantId: user.tenantId,
    name,
    description: input.description,
    isPrivate: input.isPrivate,
    isWebPublic: input.isWebPublic,
    historyPublicToSubscribers: input.historyPublicToSubscribers,
    creatorId: user.userId,
    messageRetentionDays: input.messageRetentionDays,
  });

  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;
  const subscription = new Subscription();
  subscription.Id = generateId();
  subscription.TenantId = user.tenantId;
  subscription.UserId = user.userId;
  subscription.ChannelId = channel.Id;
  subscription.Color = "#c2c2c2";
  subscription.PinToTop = 0 as int;
  subscription.IsMuted = 0 as int;
  subscription.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Subscriptions.Add(subscription);
    await db.SaveChangesAsync();
  } finally {
    db.Dispose();
  }

  return ok(channel);
};
