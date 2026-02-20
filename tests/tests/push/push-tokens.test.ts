import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Push Notification Tokens", () => {
  describe("POST /api/v1/users/me/android_gcm_reg_id", () => {
    it("should register an Android push token", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.post("/users/me/android_gcm_reg_id", {
        token: "test-token-123",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("DELETE /api/v1/users/me/android_gcm_reg_id", () => {
    it("should unregister an Android push token", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      // First register the token
      await client.post("/users/me/android_gcm_reg_id", {
        token: "test-token-123",
      });

      // Then unregister it
      const res = await client.delete("/users/me/android_gcm_reg_id", {
        token: "test-token-123",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("POST /api/v1/users/me/apns_device_token", () => {
    it("should register an APNS push token", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.post("/users/me/apns_device_token", {
        token: "test-apns-token",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("DELETE /api/v1/users/me/apns_device_token", () => {
    it("should unregister an APNS push token", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      // First register the token
      await client.post("/users/me/apns_device_token", {
        token: "test-apns-token",
      });

      // Then unregister it
      const res = await client.delete("/users/me/apns_device_token", {
        token: "test-apns-token",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });
});
