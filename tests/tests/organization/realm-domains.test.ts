import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Realm Domains", () => {
  describe("GET /api/v1/realm/domains", () => {
    it("should return the list of allowed domains", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      const res = await client.get("/realm/domains");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("domains");
    });
  });

  describe("POST /api/v1/realm/domains", () => {
    it("should allow admin to add an allowed domain", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      const res = await client.post("/realm/domains", {
        domain: "example.com",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("PATCH /api/v1/realm/domains/:domain", () => {
    it("should update an existing domain to allow subdomains", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      // First add the domain
      await client.post("/realm/domains", {
        domain: "example.com",
      });

      // Then update it
      const res = await client.patch("/realm/domains/example.com", {
        allow_subdomains: "true",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("DELETE /api/v1/realm/domains/:domain", () => {
    it("should remove a domain from the allowed list", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      // First add the domain
      await client.post("/realm/domains", {
        domain: "example.com",
      });

      // Then delete it
      const res = await client.delete("/realm/domains/example.com");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });
});
