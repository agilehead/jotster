import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
  seedMessage,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/messages/flags", function () {
  this.timeout(10000);

  it("should add the read flag to messages", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "flags-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const msgId1 = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "flags",
      content: "Message one",
    });
    const msgId2 = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "flags",
      content: "Message two",
    });

    const res = await client.post("/messages/flags", {
      messages: JSON.stringify([msgId1, msgId2]),
      op: "add",
      flag: "read",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("messages");
    expect(res.body.messages).to.be.an("array");
  });

  it("should remove the read flag from messages", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "unflag-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const msgId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "flags",
      content: "Flag then unflag",
    });

    // Add flag first
    await client.post("/messages/flags", {
      messages: JSON.stringify([msgId]),
      op: "add",
      flag: "read",
    });

    // Remove flag
    const res = await client.post("/messages/flags", {
      messages: JSON.stringify([msgId]),
      op: "remove",
      flag: "read",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("messages");
  });

  it("should add the starred flag to a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "star-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const msgId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "starred",
      content: "Star this",
    });

    const res = await client.post("/messages/flags", {
      messages: JSON.stringify([msgId]),
      op: "add",
      flag: "starred",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("POST /api/v1/mark_all_as_read", function () {
  this.timeout(10000);

  it("should mark all messages as read", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "mark-read-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "unread",
      content: "Unread message 1",
    });
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "unread",
      content: "Unread message 2",
    });

    const res = await client.post("/mark_all_as_read");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
