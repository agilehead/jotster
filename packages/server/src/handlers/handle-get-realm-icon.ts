import type { Request, Response } from "@tsonic/express/index.js";
import { authenticateRequest } from "@jotster/auth/Jotster.Auth.js";
import { JotsterDbContext } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleGetRealmIcon = async (
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
  const db = new JotsterDbContext(app.options);
  try {
    const db0 = db;
    const tenantId0 = user.tenantId;
    const tenant = await db0.Tenants
      .Where((x) => x.Id === tenantId0)
      .FirstOrDefaultAsync();

    if (tenant === undefined) {
      res.status(404).json({ result: "error", msg: "Organization not found" });
      return;
    }

    const result: Record<string, unknown> = {};
    result["result"] = "success";
    result["msg"] = "";
    result["icon_url"] = tenant.IconUrl ?? "";
    res.json(result);
  } finally {
    db.Dispose();
  }
};
