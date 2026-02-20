import type { long } from "@tsonic/core/types.js";
import { DateTimeOffset } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";

export const updateExportStatus = async (
  options: DbContextOptions,
  exportId: string,
  status: string,
  url?: string,
  errorMessage?: string
): Promise<Result<boolean, string>> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const exportId0 = exportId;

    const dataExport = await db0.DataExports
      .Where((x) => x.Id === exportId0)
      .FirstOrDefaultAsync();

    if (dataExport === undefined) {
      return err("Export not found");
    }

    const now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() as long;

    dataExport.Status = status;

    if (status === "completed") {
      dataExport.CompletedAt = now;
    }

    if (status === "failed") {
      dataExport.FailedAt = now;
    }

    if (url !== undefined) {
      dataExport.Url = url;
    }

    if (errorMessage !== undefined) {
      dataExport.ErrorMessage = errorMessage;
    }

    await db.SaveChangesAsync();
    return ok(true);
  } finally {
    db.Dispose();
  }
};
