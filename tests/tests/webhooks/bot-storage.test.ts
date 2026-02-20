import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Bot Storage", () => {
  describe("PUT /api/v1/bot_storage", () => {
    it("should allow a bot to set storage data", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, {
        isBot: 1,
        botType: 1,
      });

      const res = await client.put("/bot_storage", {
        storage: JSON.stringify({ key: "value" }),
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("GET /api/v1/bot_storage", () => {
    it("should allow a bot to retrieve its storage data", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, {
        isBot: 1,
        botType: 1,
      });

      // First set some storage
      await client.put("/bot_storage", {
        storage: JSON.stringify({ key: "value" }),
      });

      const res = await client.get("/bot_storage");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("storage");
    });

    it("should reject non-bot users from accessing bot storage", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 400 }); // regular member

      const res = await client.get("/bot_storage");

      expect(res.body.result).to.equal("error");
      expect(res.status).to.be.oneOf([400, 403]);
    });
  });

  describe("DELETE /api/v1/bot_storage", () => {
    it("should allow a bot to delete its storage", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, {
        isBot: 1,
        botType: 1,
      });

      // First set some storage
      await client.put("/bot_storage", {
        storage: JSON.stringify({ key: "value" }),
      });

      const res = await client.delete("/bot_storage");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });
});
