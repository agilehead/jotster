import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  JotsterDbContext,
  User,
  generateId,
} from "@jotster/core/Jotster.Core.js";

interface CreateUserInput {
  tenantId: long;
  email: string;
  fullName: string;
  passwordHash?: string;
  role?: int;
  isBot?: int;
  botType?: int;
  botOwnerId?: long;
  timezone?: string;
  deliveryEmail?: string;
}

export const createUser = async (
  options: DbContextOptions,
  input: CreateUserInput,
): Promise<User> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const user = new User();
  user.TenantId = input.tenantId;
  user.Email = input.email;
  user.FullName = input.fullName;
  user.PasswordHash = input.passwordHash;
  user.Role = (input.role ?? 400) as int;
  user.IsBot = (input.isBot ?? 0) as int;
  user.BotType = input.botType;
  user.BotOwnerId = input.botOwnerId;
  user.Timezone = input.timezone ?? "UTC";
  user.DeliveryEmail = input.deliveryEmail ?? input.email;
  user.IsActive = 1 as int;
  user.IsBillingAdmin = 0 as int;
  user.AvatarSource = "G";
  user.DateJoined = now;
  user.CreatedAt = now;
  user.UpdatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return user;
  } finally {
    db.Dispose();
  }
};
