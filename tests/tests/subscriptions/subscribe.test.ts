import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
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

  it("should return Zulip-compatible subscription objects", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId, { role: 100 });
    const subscriber = await seedUser(db, tenantId);
    const otherSubscriber = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "compat-subscription",
      creatorId: owner.userId,
    });

    await seedSubscription(db, tenantId, subscriber.userId, channelId);
    await seedSubscription(db, tenantId, otherSubscriber.userId, channelId);
    await db("subscription")
      .where({
        tenant_id: tenantId,
        user_id: subscriber.userId,
        channel_id: channelId,
      })
      .update({
        desktop_notifications: 1,
        push_notifications: 0,
        audible_notifications: 1,
        email_notifications: 0,
        wildcard_mentions_notify: 1,
        pin_to_top: 1,
        is_muted: 0,
      });

    const res = await subscriber.client.get("/users/me/subscriptions");
    expect(res.status).to.equal(200);

    const subscriptions = res.body.subscriptions as Array<
      Record<string, unknown>
    >;
    const subscription = subscriptions.find(
      (entry) => entry.stream_id === channelId,
    );
    expect(subscription).to.not.equal(undefined);
    expect(subscription).to.deep.include({
      stream_id: channelId,
      name: "compat-subscription",
      description: "",
      rendered_description: "",
      invite_only: false,
      is_web_public: false,
      history_public_to_subscribers: true,
      color: "#c2c2c2",
      pin_to_top: true,
      is_muted: false,
      in_home_view: true,
      desktop_notifications: true,
      push_notifications: false,
      audible_notifications: true,
      email_notifications: false,
      wildcard_mentions_notify: true,
      is_archived: false,
      stream_post_policy: 1,
      is_announcement_only: false,
      creator_id: owner.userId,
      message_retention_days: null,
    });
    expect(subscription!.date_created).to.be.a("number");
    expect(subscription!.first_message_id).to.equal(null);
    expect(subscription!.subscribers).to.have.members([
      subscriber.userId,
      otherSubscriber.userId,
    ]);
  });

  it("should omit subscribers when include_subscribers=0", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const other = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "compat-nosubscribers",
    });

    await seedSubscription(db, tenantId, user.userId, channelId);
    await seedSubscription(db, tenantId, other.userId, channelId);

    const res = await user.client.get("/users/me/subscriptions", {
      include_subscribers: "0",
    });
    expect(res.status).to.equal(200);

    const subscriptions = res.body.subscriptions as Array<
      Record<string, unknown>
    >;
    const subscription = subscriptions.find(
      (entry) => entry.stream_id === channelId,
    );
    expect(subscription).to.not.equal(undefined);
    expect(subscription).to.not.have.property("subscribers");
  });
});
