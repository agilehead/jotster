import type { JsValue } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { getExports } from "@jotster/organization/Jotster.Organization.js";
import { Convert, Math as ClrMath } from "@tsonic/dotnet/System.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetExports = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authResult = await authenticateRequest(
    app.options,
    req.get("authorization") ?? "",
  );
  if (!authResult.success) {
    res
      .status(401)
      .json({ result: "error", msg: authResult.error, code: "UNAUTHORIZED" });
    return;
  }

  const user = authResult.data;
  if (user.role > 200) {
    res.status(403).json({ result: "error", msg: "Admin required" });
    return;
  }

  const exports = await getExports(app.options, user.tenantId);

  const entries: Record<string, JsValue>[] = [];
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
    entries.push(entry);
  }

  res.json({ result: "success", msg: "", exports: entries });
};
