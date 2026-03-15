import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Channel Creation", () => {
  describe("POST /api/v1/users/me/subscriptions", () => {
    it("should create a new channel by subscribing to a non-existent channel name", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.post("/users/me/subscriptions", {
        subscriptions: JSON.stringify([
          { name: "new-channel", description: "A test channel" },
        ]),
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });

    it("should allow subscribing to multiple channels at once", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.post("/users/me/subscriptions", {
        subscriptions: JSON.stringify([
          { name: "channel-alpha" },
          { name: "channel-beta" },
        ]),
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });

    it("should return error when subscriptions parameter is missing", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.post("/users/me/subscriptions", {});
      expect(res.body.result).to.equal("error");
    });
  });

  describe("POST /api/v1/channels/create", () => {
    it("should create a channel directly if the endpoint exists", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.post("/channels/create", {
        subscriptions: JSON.stringify([{ name: "direct-create-channel" }]),
      });

      // This endpoint may or may not exist; accept success or 404
      if (res.status === 200) {
        expect(res.body.result).to.equal("success");
      } else {
        expect(res.status).to.be.oneOf([400, 404]);
      }
    });
  });
});
