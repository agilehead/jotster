import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/subscriptions", function () {
  this.timeout(10000);

  it("should subscribe the user to an existing channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "test-channel",
    });

    const res = await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "test-channel" }]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("subscribed");
    expect(res.body).to.have.property("already_subscribed");
  });

  it("should auto-create a channel when subscribing to a non-existent one", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "new-auto-channel" }]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("subscribed");
  });

  it("should report already_subscribed when subscribing twice", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "dup-channel" });

    // Subscribe the first time
    await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "dup-channel" }]),
    });

    // Subscribe again
    const res = await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "dup-channel" }]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("already_subscribed");
  });
});

describe("GET /api/v1/users/me/subscriptions", function () {
  this.timeout(10000);

  it("should return the user's subscriptions", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "sub-list-channel" });

    // Subscribe first
    await client.post("/users/me/subscriptions", {
      subscriptions: JSON.stringify([{ name: "sub-list-channel" }]),
    });

    const res = await client.get("/users/me/subscriptions");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("subscriptions");
    expect(res.body.subscriptions).to.be.an("array");
    expect((res.body.subscriptions as unknown[]).length).to.be.greaterThan(0);
  });

  it("should return an empty array when user has no subscriptions", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/users/me/subscriptions");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.subscriptions).to.be.an("array");
    expect((res.body.subscriptions as unknown[]).length).to.equal(0);
  });
});
