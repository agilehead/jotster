import type { DataExport } from "@jotster/core/Jotster.Core.js";
import type { DomainEvent } from "@jotster/event-queue/Jotster.EventQueue.js";
import { Math as ClrMath, Convert } from "@tsonic/dotnet/System.js";

interface ExportEventEntry {
  id: string;
  acting_user_id: string;
  export_time: number;
  deleted_timestamp: number | null;
  failed_timestamp: number | null;
  export_url: string | null;
  pending: boolean;
  export_type: string;
}

export const buildExportEventPayload = (exports: DataExport[]): DomainEvent => {
  const entries: ExportEventEntry[] = [];
  for (let i = 0; i < exports.length; i++) {
    const e = exports[i];
    entries[entries.length] = {
      id: e.Id,
      acting_user_id: e.RequesterId,
      export_time: ClrMath.Floor(Convert.ToDouble(e.CreatedAt) / 1000),
      deleted_timestamp: null,
      failed_timestamp: e.FailedAt ? ClrMath.Floor(Convert.ToDouble(e.FailedAt) / 1000) : null,
      export_url: e.Url ?? null,
      pending: e.Status === "pending" || e.Status === "in_progress",
      export_type: e.ExportType,
    };
  }
  return {
    type: "realm_export",
    data: {
      exports: entries,
    },
  };
};
