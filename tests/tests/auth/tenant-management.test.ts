import { expect } from "chai";
import { testDb, testServer } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";
import { ApiClient } from "../../utils/api-client.js";

describe("Internal Admin Tenant Management", () => {
  function getRootClient(): ApiClient {
    return ApiClient.bearer(testServer.getBaseUrl(), "test-root-token");
  }

  describe("POST /internal/admin/tenants", () => {
    it("should create a new tenant", async () => {
      const client = getRootClient();

      const res = await client.postRaw("/internal/admin/tenants", {
        subdomain: "new-org",
        name: "New Organization",
        description: "New Organization Description",
      });

      expect(res.status).to.equal(201);
      expect(res.body.subdomain).to.equal("new-org");
      expect(res.body.name).to.equal("New Organization");
      expect(res.body.description).to.equal("New Organization Description");
    });

    it("should reject unauthenticated requests", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      // Regular user auth should not work for internal admin endpoints
      const res = await client.postRaw("/internal/admin/tenants", {
        subdomain: "another-org",
        name: "Another Organization",
      });

      expect(res.status).to.equal(401);
    });
  });

  describe("GET /internal/admin/tenants", () => {
    it("should list tenants with root auth", async () => {
      const db = testDb.getDb();
      await seedTenant(db, { subdomain: "org-one", name: "Org One" });

      const client = getRootClient();
      const res = await client.getRaw("/internal/admin/tenants");

      expect(res.status).to.equal(200);
      expect(res.body.tenants).to.be.an("array");
    });
  });

  describe("PATCH /internal/admin/tenants/:tenant_id", () => {
    it("should update a tenant", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db, { subdomain: "update-me", name: "Original Name" });

      const client = getRootClient();

      const res = await client.patchRaw(`/internal/admin/tenants/${tenantId}`, {
        name: "Updated Name",
      });

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal("Updated Name");
    });
  });
});
