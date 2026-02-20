import type { Request, Response } from "@tsonic/express/index.js";
import { updateTenantAdmin } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateTenant = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authHeader = req.get("authorization") ?? "";
  const rootToken = authHeader.StartsWith("Bearer ") ? authHeader.Substring(7).Trim() : "";

  const tenantId = req.params["tenant_id"] ?? "";
  if (!tenantId) {
    res.status(400).json({ result: "error", msg: "Missing tenant_id" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const updates: { name?: string; description?: string; active?: number } = {};
  if (body["name"] !== undefined) updates.name = body["name"] as string;
  if (body["description"] !== undefined) updates.description = body["description"] as string;
  if (body["active"] !== undefined) updates.active = body["active"] as number;

  const result = await updateTenantAdmin(app.options, app.config, rootToken, tenantId, updates);
  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    res.status(status).json({ result: "error", msg: result.error });
    return;
  }

  const tenant = result.data;
  res.json({
    id: tenant.Id,
    subdomain: tenant.Subdomain,
    name: tenant.Name,
    description: tenant.Description,
    active: tenant.Active,
    created_at: tenant.CreatedAt,
  });
};
