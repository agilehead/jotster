import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig } from "@jotster/core/Jotster.Core.js";
import {
  JotsterDbContext,
  Tenant,
  User,
  ok,
  err,
} from "@jotster/core/Jotster.Core.js";
import { createTenant } from "../repo/create-tenant.ts";
import { getTenantBySubdomain } from "../repo/get-tenant-by-subdomain.ts";
import { hashPassword } from "../crypto/hash-password.ts";

export const createTenantAdmin = async (
  options: DbContextOptions,
  config: ServerConfig,
  rootToken: string,
  input: {
    subdomain: string;
    name: string;
    description?: string;
    adminEmail?: string;
    adminPassword?: string;
  },
): Promise<Result<Tenant, string>> => {
  if (config.rootToken.length === 0 || rootToken !== config.rootToken) {
    return err("Unauthorized");
  }

  const existing = await getTenantBySubdomain(options, input.subdomain);
  if (existing !== undefined) {
    return err("Subdomain already in use");
  }

  const tenant = await createTenant(options, {
    subdomain: input.subdomain,
    name: input.name,
    description: input.description,
  });

  const db = new JotsterDbContext(options);
  try {
    if (input.adminEmail !== undefined && input.adminPassword !== undefined) {
      const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
      const user = new User();
      user.TenantId = tenant.Id;
      user.Email = input.adminEmail;
      user.FullName = "Admin";
      user.PasswordHash = hashPassword(input.adminPassword);
      user.Role = 100 as int;
      user.AvatarSource = "G";
      user.IsBot = 0 as int;
      user.IsActive = 1 as int;
      user.Timezone = "UTC";
      user.DateJoined = now;
      user.IsBillingAdmin = 0 as int;
      user.DeliveryEmail = input.adminEmail;
      user.CreatedAt = now;
      user.UpdatedAt = now;
      db.Users.Add(user);
      await db.SaveChangesAsync();
    }
  } finally {
    db.Dispose();
  }

  return ok(tenant);
};
