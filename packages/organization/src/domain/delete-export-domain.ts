import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { deleteExport } from "../repo/delete-export.ts";
import { getExports } from "../repo/get-exports.ts";
import { buildExportEventPayload } from "./build-export-event-payload.ts";

export const deleteExportDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  exportId: long,
): Promise<Result<boolean, string>> => {
  // Validate user is admin (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  // Delete the export record
  const result = await deleteExport(options, exportId);
  if (!result.success) {
    return err(result.error);
  }

  // Emit realm_export event with updated export list
  const updatedExports = await getExports(options, user.tenantId);
  const payload = buildExportEventPayload(updatedExports);
  dispatchEventToTenant(user.tenantId, payload);

  return ok(true);
};
