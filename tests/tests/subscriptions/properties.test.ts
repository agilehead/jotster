import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/subscriptions/properties", function () {
  this.timeout(10000);

  it("should update subscription color", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "color-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/users/me/subscriptions/properties", {
      subscription_data: JSON.stringify([
        { stream_id: channelId, property: "color", value: "#ff0000" },
      ]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should update pin_to_top property", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "pin-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/users/me/subscriptions/properties", {
      subscription_data: JSON.stringify([
        { stream_id: channelId, property: "pin_to_top", value: true },
      ]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should update is_muted property", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "mute-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/users/me/subscriptions/properties", {
      subscription_data: JSON.stringify([
        { stream_id: channelId, property: "is_muted", value: true },
      ]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return ignored unsupported top-level parameters and validate update payloads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "ignored-params-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const successRes = await client.post("/users/me/subscriptions/properties", {
      subscription_data: JSON.stringify([
        { stream_id: channelId, property: "is_muted", value: true },
      ]),
      ignored_extra: "1",
    });

    expect(successRes.status).to.equal(200);
    expect(successRes.body.result).to.equal("success");
    expect(successRes.body.msg).to.equal("");
    expect(successRes.body.ignored_parameters_unsupported).to.deep.equal(["ignored_extra"]);

    const invalidRes = await client.post("/users/me/subscriptions/properties", {
      subscription_data: JSON.stringify([
        { stream_id: channelId, property: "is_muted", value: "bogus" },
      ]),
    });
    expect(invalidRes.status).to.equal(400);
    expect(invalidRes.body.msg).to.equal("Invalid value for property: is_muted");
    expect(invalidRes.body.code).to.equal("BAD_REQUEST");
  });
});

describe("GET /api/v1/users/{user_id}/subscriptions/{stream_id}", function () {
  this.timeout(10000);

  it("should confirm that a user is subscribed to a channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "check-sub-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.get(
      `/users/${userId}/subscriptions/${channelId}`
    );

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("is_subscribed");
    expect(res.body.is_subscribed).to.equal(true);
  });

  it("should report not subscribed for an unsubscribed channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "not-sub-channel",
    });

    const res = await client.get(
      `/users/${userId}/subscriptions/${channelId}`
    );

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.is_subscribed).to.equal(false);
  });
});

describe("GET /api/v1/users/{user_id}/channels", function () {
  this.timeout(10000);

  it("should return subscribed channel ids for a user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "user-ch-list",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.get(`/users/${userId}/channels`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(res.body).to.have.property("subscribed_channel_ids");
    expect(res.body).to.not.have.property("channels");
    expect(res.body.subscribed_channel_ids).to.deep.equal([channelId]);
  });

  it("should return an empty array for a user with no subscriptions", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);

    const res = await client.get(`/users/${userId}/channels`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.subscribed_channel_ids).to.deep.equal([]);
  });
});

describe("PATCH /api/v1/users/me/subscriptions/{stream_id}", function () {
  this.timeout(10000);

  it("should update a single subscription property", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "single-property-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.patch(`/users/me/subscriptions/${channelId}`, {
      property: "is_muted",
      value: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");

    const row = await db("subscription")
      .select("is_muted")
      .where({ tenant_id: tenantId, user_id: userId, channel_id: channelId })
      .first();
    expect(row?.is_muted).to.equal(1);
  });

  it("should validate required fields for a single subscription property update", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "single-property-errors",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const missingPropertyRes = await client.patch(`/users/me/subscriptions/${channelId}`, {
      value: "true",
    });
    expect(missingPropertyRes.status).to.equal(400);
    expect(missingPropertyRes.body.msg).to.equal("Missing required field: property");
    expect(missingPropertyRes.body.code).to.equal("BAD_REQUEST");

    const missingValueRes = await client.patch(`/users/me/subscriptions/${channelId}`, {
      property: "is_muted",
    });
    expect(missingValueRes.status).to.equal(400);
    expect(missingValueRes.body.msg).to.equal("Missing required field: value");
    expect(missingValueRes.body.code).to.equal("BAD_REQUEST");
  });
});

describe("PATCH /api/v1/users/me/subscriptions", function () {
  this.timeout(10000);

  it("should bulk subscribe and unsubscribe channels", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const existingChannelId = await seedChannel(db, tenantId, {
      name: "bulk-existing-channel",
    });
    await seedSubscription(db, tenantId, userId, existingChannelId);

    const res = await client.patch("/users/me/subscriptions", {
      add: JSON.stringify([{ name: "bulk-new-channel" }]),
      delete: JSON.stringify(["bulk-existing-channel"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(res.body.subscribed).to.be.an("array");
    expect(res.body.removed).to.be.an("array");

    const removedRows = await db("subscription").where({
      tenant_id: tenantId,
      user_id: userId,
      channel_id: existingChannelId,
    });
    expect(removedRows).to.have.length(0);

    const newChannel = await db("channel")
      .select("id")
      .where({ tenant_id: tenantId, name: "bulk-new-channel" })
      .first();
    expect(newChannel?.id).to.be.a("number");

    const addedRows = await db("subscription").where({
      tenant_id: tenantId,
      user_id: userId,
      channel_id: newChannel!.id as number,
    });
    expect(addedRows).to.have.length(1);
  });
});
