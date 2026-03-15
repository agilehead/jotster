import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { JotsterDbContext, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getExports } from "../repo/get-exports.ts";
import { createExport } from "../repo/create-export.ts";
import { processExportDomain } from "./process-export-domain.ts";
import { buildExportEventPayload } from "./build-export-event-payload.ts";

export const initiateExportDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  exportType: string,
): Promise<Result<long, string>> => {
  if (
    exportType !== "public" &&
    exportType !== "full_with_consent" &&
    exportType !== "full_without_consent"
  ) {
    return err("Invalid export type");
  }

  // Validate user is admin (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  if (exportType === "full_without_consent") {
    const db = new JotsterDbContext(options);
    try {
      const tenantId0 = user.tenantId;
      const tenant = await db.Tenants.Where(
        (entry) => entry.Id === tenantId0,
      ).FirstOrDefaultAsync();

      if (
        tenant === undefined ||
        tenant === null ||
        tenant.OwnerFullContentAccess !== 1
      ) {
        return err(
          "Exports of all public and private data are not enabled for this organization.",
        );
      }
    } finally {
      db.Dispose();
    }

    if (user.role !== 100) {
      return err("Must be an organization owner");
    }
  }

  // Check no other export with status "pending" or "in_progress" for this tenant
  const existingExports = await getExports(options, user.tenantId);
  for (let i = 0; i < existingExports.length; i++) {
    const status = existingExports[i].Status;
    if (status === "pending" || status === "in_progress") {
      return err("An export is already in progress");
    }
  }

  // Create export record
  const dataExport = await createExport(
    options,
    user.tenantId,
    user.userId,
    exportType,
  );

  // Start processing asynchronously (fire-and-forget)
  void processExportDomain(options, dataExport.Id, user.tenantId, exportType);

  // Emit realm_export event with updated export list
  const updatedExports = await getExports(options, user.tenantId);
  const payload = buildExportEventPayload(updatedExports);
  dispatchEventToTenant(user.tenantId, payload);

  return ok(dataExport.Id);
};
