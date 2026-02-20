import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/typing", () => {
  it("should send a typing notification for a channel topic", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/typing", {
      type: "stream",
      op: "start",
      stream_id: channelId,
      topic: "test topic",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should send a typing notification for a direct message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const res = await sender.client.post("/typing", {
      type: "direct",
      op: "start",
      to: JSON.stringify([recipient.userId]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should send a stop typing notification", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const res = await sender.client.post("/typing", {
      type: "direct",
      op: "stop",
      to: JSON.stringify([recipient.userId]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should reject typing notification with missing op parameter", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/typing", {
      type: "direct",
      to: JSON.stringify(["some_user_id"]),
    });

    expect(res.body.result).to.equal("error");
  });
});
