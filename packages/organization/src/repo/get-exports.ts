import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DataExport } from "@jotster/core/Jotster.Core.js";

export const getExports = async (
  options: DbContextOptions,
  tenantId: string
): Promise<DataExport[]> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const tenantId0 = tenantId;
    const result = await db0.DataExports
      .Where((x) => x.TenantId === tenantId0)
      .OrderByDescending((x) => x.CreatedAt)
      .ToArrayAsync();
    return result;
  } finally {
    db.Dispose();
  }
};
