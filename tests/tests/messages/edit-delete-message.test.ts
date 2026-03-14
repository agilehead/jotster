import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
  seedMessage,
} from "../../utils/test-helpers.js";

describe("PATCH /api/v1/messages/{message_id}", function () {
  this.timeout(10000);

  it("should edit the content of a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "edit-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "editable",
      content: "Original content",
    });

    const res = await client.patch(`/messages/${messageId}`, {
      content: "Updated content",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should edit the topic of a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "topic-edit-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "old-topic",
      content: "Some content",
    });

    const res = await client.patch(`/messages/${messageId}`, {
      topic: "new-topic",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("DELETE /api/v1/messages/{message_id}", function () {
  this.timeout(10000);

  it("should delete a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "delete-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "deletable",
      content: "Delete me",
    });

    const res = await client.delete(`/messages/${messageId}`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when deleting a non-existent message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/messages/msg_nonexistent999");

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});

describe("GET /api/v1/messages/{message_id}/history", function () {
  this.timeout(10000);

  it("should return edit history after editing a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "history-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "history-topic",
      content: "Before edit",
    });

    // Edit the message to create history
    await client.patch(`/messages/${messageId}`, {
      content: "After edit",
    });

    const res = await client.get(`/messages/${messageId}/history`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("message_history");
    expect(res.body.message_history).to.be.an("array");
  });
});
