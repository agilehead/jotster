import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
  seedMessage,
} from "../../utils/test-helpers.js";

describe("GET /api/v1/messages", function () {
  this.timeout(10000);

  it("should fetch messages with anchor=newest", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "fetch-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    // Seed a few messages
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "topic-a",
      content: "First message",
    });
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "topic-a",
      content: "Second message",
    });
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "topic-a",
      content: "Third message",
    });

    const res = await client.get("/messages", {
      anchor: "newest",
      num_before: "5",
      num_after: "0",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("messages");
    expect(res.body.messages).to.be.an("array");
    expect(res.body).to.have.property("found_newest");
    expect(res.body).to.have.property("found_oldest");
  });

  it("should fetch messages with narrow filter for a channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "narrow-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "narrowed",
      content: "Narrowed message",
    });

    const narrow = JSON.stringify([
      { operator: "channel", operand: "narrow-channel" },
    ]);

    const res = await client.get("/messages", {
      anchor: "newest",
      num_before: "10",
      num_after: "0",
      narrow,
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.messages).to.be.an("array");
    expect((res.body.messages as unknown[]).length).to.be.greaterThan(0);
  });

  it("should return empty messages array when no messages exist", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/messages", {
      anchor: "newest",
      num_before: "5",
      num_after: "0",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.messages).to.be.an("array");
    expect((res.body.messages as unknown[]).length).to.equal(0);
  });
});

describe("GET /api/v1/messages/:message_id", function () {
  this.timeout(10000);

  it("should fetch a single message by ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "single-msg-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "single-topic",
      content: "Fetch me!",
    });

    const res = await client.get(`/messages/${messageId}`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("message");
  });

  it("should return error for a non-existent message ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/messages/msg_nonexistent999");

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});
