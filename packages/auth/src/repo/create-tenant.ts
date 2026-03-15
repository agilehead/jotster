import type { int, long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, Tenant, generateId, allocatePublicId } from "@jotster/core/Jotster.Core.js";

export const createTenant = async (
  options: DbContextOptions,
  input: { subdomain: string; name: string; description?: string }
): Promise<Tenant> => {
  const db = new JotsterDbContext(options);
  try {
    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    const tenant = new Tenant();
    tenant.Id = generateId();
    tenant.PublicId = await allocatePublicId(options, "tenant");
    tenant.Subdomain = input.subdomain;
    tenant.Name = input.name;
    tenant.Description = input.description ?? "";
    tenant.SettingsJson = "{}";
    tenant.Active = 1 as int;
    tenant.CreatedAt = now;
    tenant.UpdatedAt = now;
    db.Tenants.Add(tenant);
    await db.SaveChangesAsync();
    return tenant;
  } finally {
    db.Dispose();
  }
};
