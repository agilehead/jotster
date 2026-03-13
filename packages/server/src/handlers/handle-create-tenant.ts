import type { Request, Response } from "@tsonic/express/index.js";
import { createTenantAdmin } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";

export const handleCreateTenant = async (
  req: Request,
  res: Response,
  app: AppContext
): Promise<void> => {
  const authHeader = req.get("authorization") ?? "";
  const rootToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";

  const body = req.body as Record<string, unknown>;
  const subdomain = body["subdomain"] as string | undefined;
  const name = body["name"] as string | undefined;
  const description = body["description"] as string | undefined;
  const adminEmail = body["admin_email"] as string | undefined;
  const adminPassword = body["admin_password"] as string | undefined;

  if (!subdomain || !name || !adminEmail || !adminPassword) {
    res.status(400).json({ result: "error", msg: "Missing required fields: subdomain, name, admin_email, admin_password" });
    return;
  }

  const result = await createTenantAdmin(app.options, app.config, rootToken, ({
    subdomain, name, description, adminEmail, adminPassword,
  }));

  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    res.status(status).json({ result: "error", msg: result.error });
    return;
  }

  const tenant = result.data;
  res.status(201).json({
    id: tenant.Id,
    subdomain: tenant.Subdomain,
    name: tenant.Name,
    description: tenant.Description,
    created_at: tenant.CreatedAt,
  });
};
