import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Subscription, generateId } from "@jotster/core/Jotster.Core.js";

interface CreateSubscriptionInput {
  tenantId: string;
  userId: string;
  channelId: string;
  color?: string;
}

export const createSubscription = async (
  options: DbContextOptions,
  input: CreateSubscriptionInput
): Promise<Subscription> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const sub = new Subscription();
  sub.Id = generateId();
  sub.TenantId = input.tenantId;
  sub.UserId = input.userId;
  sub.ChannelId = input.channelId;
  sub.Color = input.color ?? "#c2c2c2";
  sub.PinToTop = 0 as int;
  sub.IsMuted = 0 as int;
  sub.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Subscriptions.Add(sub);
    await db.SaveChangesAsync();
    return sub;
  } finally {
    db.Dispose();
  }
};
