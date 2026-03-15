import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, DataExport } from "@jotster/core/Jotster.Core.js";

export const createExport = async (
  options: DbContextOptions,
  tenantId: long,
  requesterId: long,
  exportType: string,
): Promise<DataExport> => {
  const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

  const dataExport = new DataExport();
  dataExport.TenantId = tenantId;
  dataExport.RequesterId = requesterId;
  dataExport.ExportType = exportType;
  dataExport.Status = "pending";
  dataExport.CreatedAt = now;

  const db = new JotsterDbContext(options);
  try {
    db.DataExports.Add(dataExport);
    await db.SaveChangesAsync();
    return dataExport;
  } finally {
    db.Dispose();
  }
};
