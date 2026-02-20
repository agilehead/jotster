import type { DataExport } from "@jotster/core/Jotster.Core.js";

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

interface ExportEventPayload {
  type: string;
  exports: ExportEventEntry[];
}

export const buildExportEventPayload = (exports: DataExport[]): ExportEventPayload => {
  const entries: ExportEventEntry[] = [];
  for (let i = 0; i < exports.Length; i++) {
    const e = exports[i];
    entries[entries.length] = {
      id: e.Id,
      acting_user_id: e.RequesterId,
      export_time: Math.floor(Number(e.CreatedAt) / 1000),
      deleted_timestamp: null,
      failed_timestamp: e.FailedAt ? Math.floor(Number(e.FailedAt) / 1000) : null,
      export_url: e.Url ?? null,
      pending: e.Status === "pending" || e.Status === "in_progress",
      export_type: e.ExportType,
    };
  }
  return {
    type: "realm_export",
    exports: entries,
  };
};
