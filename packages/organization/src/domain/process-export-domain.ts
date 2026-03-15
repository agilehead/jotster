import type { long } from "@tsonic/core/types.js";
import { Convert } from "@tsonic/dotnet/System.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateExportStatus } from "../repo/update-export-status.ts";
import { getExports } from "../repo/get-exports.ts";
import { buildExportEventPayload } from "./build-export-event-payload.ts";

export const processExportDomain = async (
  options: DbContextOptions,
  exportId: long,
  tenantId: long,
  exportType: string
): Promise<void> => {
  try {
    // Update status to "in_progress"
    await updateExportStatus(options, exportId, "in_progress");

    // Emit realm_export event with updated status
    let exports = await getExports(options, tenantId);
    let payload = buildExportEventPayload(exports);
    dispatchEventToTenant(tenantId, payload);

    // TODO: Implement actual archive creation.
    // This should collect all org data (users, channels, messages, subscriptions,
    // custom emoji, custom profile fields, attachments, etc.) and produce a .tar.gz
    // archive in the Zulip-compatible data export format.

    // For now, mark as completed with a placeholder URL
    const exportUrl = "/exports/" + Convert.ToString(exportId) + ".tar.gz";
    await updateExportStatus(options, exportId, "completed", exportUrl);

    // Emit realm_export event with completed status
    exports = await getExports(options, tenantId);
    payload = buildExportEventPayload(exports);
    dispatchEventToTenant(tenantId, payload);
  } catch {
    // If any step fails, update status to "failed"
    await updateExportStatus(options, exportId, "failed", undefined, "Export processing failed");

    // Emit realm_export event with failed status
    const exports = await getExports(options, tenantId);
    const payload = buildExportEventPayload(exports);
    dispatchEventToTenant(tenantId, payload);
  }
};
