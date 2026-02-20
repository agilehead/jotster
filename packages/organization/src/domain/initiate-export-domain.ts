import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { getExports } from "../repo/get-exports.ts";
import { createExport } from "../repo/create-export.ts";
import { processExportDomain } from "./process-export-domain.ts";
import { buildExportEventPayload } from "./build-export-event-payload.ts";

export const initiateExportDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  exportType: string
): Promise<Result<string, string>> => {
  // Validate user is admin (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  // Check no other export with status "pending" or "in_progress" for this tenant
  const existingExports = await getExports(options, user.tenantId);
  for (let i = 0; i < existingExports.Length; i++) {
    const status = existingExports[i].Status;
    if (status === "pending" || status === "in_progress") {
      return err("An export is already in progress");
    }
  }

  // Create export record
  const dataExport = await createExport(options, user.tenantId, user.userId, exportType);

  // Start processing asynchronously (fire-and-forget)
  void processExportDomain(options, dataExport.Id, user.tenantId, exportType);

  // Emit realm_export event with updated export list
  const updatedExports = await getExports(options, user.tenantId);
  const payload = buildExportEventPayload(updatedExports);
  dispatchEventToTenant(user.tenantId, payload);

  return ok(dataExport.Id);
};
