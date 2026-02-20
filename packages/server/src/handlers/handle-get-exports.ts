import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getExports } from "@jotster/organization/Jotster.Organization.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetExports = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authResult = await authenticateRequest(app.options, req.get("authorization") ?? "");
  if (!authResult.success) {
    res.status(401).json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;

  const exports = await getExports(app.options, user.tenantId);

  const entries: Record<string, unknown>[] = [];
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

  res.json({ result: "success", msg: "", exports: entries });
};
