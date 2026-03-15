import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/muted_users/{muted_user_id}", () => {
  it("should mute a user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    const res = await user1.client.post(
      `/users/me/muted_users/${user2.userId}`,
    );

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should return error when muting an already muted user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    // Mute once
    await user1.client.post(`/users/me/muted_users/${user2.userId}`);

    // Mute again
    const res = await user1.client.post(
      `/users/me/muted_users/${user2.userId}`,
    );

    expect(res.body.result).to.equal("error");
  });
});

describe("DELETE /api/v1/users/me/muted_users/{muted_user_id}", () => {
  it("should unmute a previously muted user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    // Mute first
    await user1.client.post(`/users/me/muted_users/${user2.userId}`);

    // Unmute
    const res = await user1.client.delete(
      `/users/me/muted_users/${user2.userId}`,
    );

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should return error when unmuting a user that is not muted", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    const res = await user1.client.delete(
      `/users/me/muted_users/${user2.userId}`,
    );

    expect(res.body.result).to.equal("error");
  });
});

describe("POST /api/v1/user_topics", () => {
  it("should mute a topic with visibility_policy=1", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    const res = await client.post("/user_topics", {
      stream_id: channelId,
      topic: "test topic",
      visibility_policy: "1",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should unmute a topic with visibility_policy=0", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    // Mute first
    await client.post("/user_topics", {
      stream_id: channelId,
      topic: "test topic",
      visibility_policy: "1",
    });

    // Unmute
    const res = await client.post("/user_topics", {
      stream_id: channelId,
      topic: "test topic",
      visibility_policy: "0",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
