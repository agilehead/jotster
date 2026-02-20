import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
} from "../../utils/test-helpers.js";

describe("DELETE /api/v1/users/me/subscriptions", function () {
  this.timeout(10000);

  it("should unsubscribe the user from a channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "unsub-channel" });

    // Subscribe first
    await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "unsub-channel" }]),
    });

    // Unsubscribe
    const res = await client.delete("/users/me/subscriptions", {
      subscriptions: JSON.stringify(["unsub-channel"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("removed");
    expect(res.body.removed).to.be.an("array");
    expect(res.body.removed).to.include("unsub-channel");
  });

  it("should report not_removed for channels the user is not subscribed to", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/users/me/subscriptions", {
      subscriptions: JSON.stringify(["nonexistent-channel"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("not_removed");
    expect(res.body.not_removed).to.be.an("array");
    expect(res.body.not_removed).to.include("nonexistent-channel");
  });

  it("should confirm unsubscription via GET after unsubscribing", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "verify-unsub" });

    // Subscribe
    await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "verify-unsub" }]),
    });

    // Unsubscribe
    await client.delete("/users/me/subscriptions", {
      subscriptions: JSON.stringify(["verify-unsub"]),
    });

    // Verify subscription list is empty
    const res = await client.get("/users/me/subscriptions");
    expect(res.status).to.equal(200);
    const subs = res.body.subscriptions as Array<Record<string, unknown>>;
    const names = subs.map((s) => s.name);
    expect(names).to.not.include("verify-unsub");
  });
});
