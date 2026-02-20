import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Data Export", () => {
  describe("GET /api/v1/export/realm", () => {
    it("should allow admin to list all exports", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.get("/export/realm");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("exports");
    });

    it("should reject non-admin from listing exports", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 400 }); // member

      const res = await client.get("/export/realm");

      expect(res.body.result).to.equal("error");
      expect(res.status).to.be.oneOf([400, 403]);
    });
  });

  describe("POST /api/v1/export/realm", () => {
    it("should allow admin to initiate a data export", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.post("/export/realm", {
        export_type: "full",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("id");
    });

    it("should reject non-admin from initiating an export", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 400 }); // member

      const res = await client.post("/export/realm", {
        export_type: "full",
      });

      expect(res.body.result).to.equal("error");
      expect(res.status).to.be.oneOf([400, 403]);
    });
  });

  describe("GET /api/v1/export/realm/consents", () => {
    it("should return export consents", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.get("/export/realm/consents");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });
});
