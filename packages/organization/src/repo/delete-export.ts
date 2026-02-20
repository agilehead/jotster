import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";

export const deleteExport = async (
  options: DbContextOptions,
  exportId: string
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

    db.DataExports.Remove(dataExport);
    await db.SaveChangesAsync();
    return ok(true);
  } finally {
    db.Dispose();
  }
};
