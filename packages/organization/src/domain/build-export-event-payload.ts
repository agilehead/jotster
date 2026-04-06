import type { JsValue, long } from "@tsonic/core/types.js";
import type { DataExport } from "@jotster/core/Jotster.Core.js";
import type { DomainEvent } from "@jotster/event-queue/Jotster.EventQueue.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Math as ClrMath, Convert } from "@tsonic/dotnet/System.js";

interface ExportEventEntry {
  id: long;
  acting_user_id: long;
  export_time: number;
  deleted_timestamp: number | null;
  failed_timestamp: number | null;
  export_url: string | null;
  pending: boolean;
  export_type: string;
}

export const buildExportEventPayload = (exports: DataExport[]): DomainEvent => {
  const entries = new List<Record<string, JsValue>>();
  for (let i = 0; i < exports.length; i++) {
    const e = exports[i];
    const entry: Record<string, JsValue> = {
      id: e.Id,
      acting_user_id: e.RequesterId,
      export_time: ClrMath.Floor(Convert.ToDouble(e.CreatedAt) / 1000),
      deleted_timestamp: null,
      failed_timestamp: e.FailedAt
        ? ClrMath.Floor(Convert.ToDouble(e.FailedAt) / 1000)
        : null,
      export_url: e.Url ?? null,
      pending: e.Status === "pending" || e.Status === "in_progress",
      export_type: e.ExportType,
    };
    entries.Add(entry);
  }
  return {
    type: "realm_export",
    data: {
      exports: entries.ToArray(),
    },
  };
};
