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
    it("should default to a public export when export_type is omitted", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.post("/export/realm");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("id");

      const listRes = await client.get("/export/realm");
      expect(listRes.status).to.equal(200);
      expect((listRes.body.exports as Array<Record<string, unknown>>)[0].export_type).to.equal("public");
    });

    it("should allow admins to request a full export with consent", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      const res = await client.post("/export/realm", {
        export_type: "full_with_consent",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");

      const listRes = await client.get("/export/realm");
      expect((listRes.body.exports as Array<Record<string, unknown>>)[0].export_type).to.equal("full_with_consent");
    });

    it("should reject invalid export types", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 });

      const res = await client.post("/export/realm", {
        export_type: "invalid",
      });

      expect(res.status).to.equal(400);
      expect(res.body.result).to.equal("error");
      expect(res.body.msg).to.equal("Invalid export type");
    });

    it("should require organization-level permission for full exports without consent", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const admin = await seedUser(db, tenantId, { role: 200 });
      const owner = await seedUser(db, tenantId, { role: 100 });

      const disabledRes = await admin.client.post("/export/realm", {
        export_type: "full_without_consent",
      });
      expect(disabledRes.status).to.equal(400);
      expect(disabledRes.body.msg).to.equal("Exports of all public and private data are not enabled for this organization.");

      await db("tenant").where({ id: tenantId }).update({ owner_full_content_access: 1 });

      const adminRes = await admin.client.post("/export/realm", {
        export_type: "full_without_consent",
      });
      expect(adminRes.status).to.equal(400);
      expect(adminRes.body.msg).to.equal("Must be an organization owner");

      const ownerRes = await owner.client.post("/export/realm", {
        export_type: "full_without_consent",
      });
      expect(ownerRes.status).to.equal(200);
      expect(ownerRes.body.result).to.equal("success");
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
    it("should return export consents with visibility policy and consent state", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const admin = await seedUser(db, tenantId, { role: 200 });
      const consented = await seedUser(db, tenantId);
      const hidden = await seedUser(db, tenantId);

      await db("user_setting").where({ user_id: consented.userId }).update({
        allow_private_data_export: 1,
      });
      await db("user_setting").where({ user_id: hidden.userId }).update({
        email_address_visibility: 2,
      });

      const res = await admin.client.get("/export/realm/consents");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body.export_consents).to.be.an("array");

      const consents = res.body.export_consents as Array<Record<string, unknown>>;
      const consentedEntry = consents.find((entry) => entry.user_id === consented.userId);
      const hiddenEntry = consents.find((entry) => entry.user_id === hidden.userId);
      const adminEntry = consents.find((entry) => entry.user_id === admin.userId);

      expect(consentedEntry?.consented).to.equal(true);
      expect(consentedEntry?.email_address_visibility).to.equal(1);
      expect(hiddenEntry?.consented).to.equal(false);
      expect(hiddenEntry?.email_address_visibility).to.equal(2);
      expect(adminEntry?.consented).to.equal(false);
    });

    it("should reject non-admin users from viewing export consents", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const member = await seedUser(db, tenantId);

      const res = await member.client.get("/export/realm/consents");

      expect(res.status).to.equal(400);
      expect(res.body.result).to.equal("error");
      expect(res.body.msg).to.equal("Insufficient permission");
    });
  });
});
