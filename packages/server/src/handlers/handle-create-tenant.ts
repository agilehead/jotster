import type { Request, Response } from "@tsonic/express/index.js";
import { createTenantAdmin } from "@jotster/auth/Jotster.Auth.js";
import type { AppContext } from "../helpers/app-context.ts";
import { getBodyObject, getOptionalStringField } from "../helpers/body.ts";

export const handleCreateTenant = async (
  req: Request,
  res: Response,
  app: AppContext,
): Promise<void> => {
  const authHeader = req.get("authorization") ?? "";
  const rootToken = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : "";

  const body = getBodyObject(req);
  const subdomain = getOptionalStringField(body, "subdomain");
  const name = getOptionalStringField(body, "name");
  const description = getOptionalStringField(body, "description");
  const adminEmail = getOptionalStringField(body, "admin_email");
  const adminPassword = getOptionalStringField(body, "admin_password");

  if (!subdomain || !name) {
    res
      .status(400)
      .json({
        result: "error",
        msg: "Missing required fields: subdomain, name",
      });
    return;
  }

  const result = await createTenantAdmin(app.options, app.config, rootToken, {
    subdomain,
    name,
    description,
    adminEmail,
    adminPassword,
  });

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
