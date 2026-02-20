import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/messages", function () {
  this.timeout(10000);

  it("should send a channel message by channel name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "send-test-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/messages", {
      type: "stream",
      to: "send-test-channel",
      topic: "greetings",
      content: "Hello from the test!",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("id");
    expect(res.body.id).to.be.a("string");
  });

  it("should send a channel message by stream_id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "stream-id-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/messages", {
      type: "stream",
      to: channelId,
      topic: "test topic",
      content: "Message via stream_id",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("id");
  });

  it("should send a direct message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    const { userId: recipientId } = await seedUser(db, tenantId, {
      email: "recipient@test.local",
      fullName: "Recipient User",
    });

    const res = await client.post("/messages", {
      type: "direct",
      to: JSON.stringify([recipientId]),
      content: "Hello via DM!",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("id");
  });

  it("should fail to send a channel message without subscription", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "no-sub-channel" });

    const res = await client.post("/messages", {
      type: "stream",
      to: "no-sub-channel",
      topic: "test",
      content: "Should fail",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});
