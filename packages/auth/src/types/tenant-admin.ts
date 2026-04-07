export interface CreateTenantInput {
  subdomain: string;
  name: string;
  description?: string;
}

export interface CreateTenantAdminInput extends CreateTenantInput {
  adminEmail?: string;
  adminPassword?: string;
}
