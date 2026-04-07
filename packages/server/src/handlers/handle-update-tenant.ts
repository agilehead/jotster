import type { int } from "@tsonic/core/types.js";
import type { Request, Response } from "@tsonic/express/index.js";
import { updateTenantAdmin } from "@jotster/auth/Jotster.Auth.js";
import { getBodyObject, toOptionalInt, toLong } from "../helpers/body.ts";
import { parseId } from "@jotster/core/Jotster.Core.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleUpdateTenant = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authHeader = req.get("authorization") ?? "";
  const rootToken = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : "";

  const tenantId = parseId(req.param("tenant_id") ?? "");
  if (tenantId === undefined) {
    res.status(400).json({ result: "error", msg: "Missing tenant_id" });
    return;
  }

  const body = getBodyObject(req);
  const updates: { name?: string; description?: string; active?: int } = {};
  if (body["name"] !== undefined) updates.name = body["name"] as string;
  if (body["description"] !== undefined)
    updates.description = body["description"] as string;
  if (body["active"] !== undefined)
    updates.active = toOptionalInt(body["active"]);

  const result = await updateTenantAdmin(
    app.options,
    app.config,
    rootToken,
    toLong(tenantId),
    updates,
  );
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
