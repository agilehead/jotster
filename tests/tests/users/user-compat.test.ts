import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedChannel, seedMessage, seedSubscription, seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("User compatibility endpoints", () => {
  it("GET /api/v1/users/{email} and PATCH /api/v1/users/{email} should get and update a user by email path", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId, { fullName: "Original Name" });
    const encodedEmail = encodeURIComponent(member.email);

    const getRes = await admin.client.get(`/users/${encodedEmail}`);
    expect(getRes.status).to.equal(200);
    expect((getRes.body.user as Record<string, unknown>).email).to.equal(member.email);

    const patchRes = await admin.client.patch(`/users/${encodedEmail}`, {
      full_name: "Updated Name",
    });
    expect(patchRes.status).to.equal(200);

    const getUpdatedRes = await admin.client.get(`/users/${encodedEmail}`);
    expect((getUpdatedRes.body.user as Record<string, unknown>).full_name).to.equal("Updated Name");
  });

  it("GET /api/v1/users/{email} and PATCH /api/v1/users/{email} should resolve Zulip dummy email addresses to the target user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, { subdomain: "compat-users" });
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId, { fullName: "Dummy Email User" });
    const dummyEmail = encodeURIComponent(`user${member.userId}@compat-users.test.local`);

    const getRes = await admin.client.get(`/users/${dummyEmail}`);
    expect(getRes.status).to.equal(200);
    expect((getRes.body.user as Record<string, unknown>).user_id).to.equal(member.userId);

    const patchRes = await admin.client.patch(`/users/${dummyEmail}`, {
      full_name: "Dummy Email Updated",
    });
    expect(patchRes.status).to.equal(200);

    const getUpdatedRes = await admin.client.get(`/users/${member.userId}`);
    expect((getUpdatedRes.body.user as Record<string, unknown>).full_name).to.equal("Dummy Email Updated");
  });

  it("POST /api/v1/users/{user_id}/status and GET /api/v1/users/{user_id}/status should update another user's status by user id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const postRes = await admin.client.post(`/users/${member.userId}/status`, {
      status_text: "reviewing",
      emoji_name: "working_on_it",
      emoji_code: "1f6e0",
      reaction_type: "unicode_emoji",
    });
    expect(postRes.status).to.equal(200);

    const getRes = await admin.client.get(`/users/${member.userId}/status`);
    expect(getRes.status).to.equal(200);
    expect((getRes.body.status as Record<string, unknown>).status_text).to.equal("reviewing");
  });

  it("POST /api/v1/users/{user_id}/status should reject non-admin requesters and unknown users", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberRes = await member.client.post(`/users/${admin.userId}/status`, {
      status_text: "reviewing",
    });
    expect(memberRes.status).to.equal(403);
    expect(memberRes.body.msg).to.equal("Insufficient permission");
    expect(memberRes.body.code).to.equal("BAD_REQUEST");

    const missingUserRes = await admin.client.post("/users/999999/status", {
      status_text: "reviewing",
    });
    expect(missingUserRes.status).to.equal(400);
    expect(missingUserRes.body.msg).to.equal("User not found");
    expect(missingUserRes.body.code).to.equal("BAD_REQUEST");
  });

  it("GET /api/v1/bots/{bot_id}/api_key and POST /api/v1/bots/{bot_id}/api_key/regenerate should work for a bot owner", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const bot = await seedUser(db, tenantId, {
      email: `bot-${Date.now()}@test.local`,
      isBot: 1,
      botType: 1,
      botOwnerId: admin.userId,
    });

    const getRes = await admin.client.get(`/bots/${bot.userId}/api_key`);
    expect(getRes.status).to.equal(200);
    const originalKey = getRes.body.api_key as string;
    expect(originalKey).to.be.a("string").and.not.equal("");

    const regenerateRes = await admin.client.post(`/bots/${bot.userId}/api_key/regenerate`);
    expect(regenerateRes.status).to.equal(200);
    const regeneratedKey = regenerateRes.body.api_key as string;
    expect(regeneratedKey).to.be.a("string").and.not.equal("");
    expect(regeneratedKey).to.not.equal(originalKey);
  });

  it("GET /api/v1/bots/{bot_id}/api_key and POST /api/v1/bots/{bot_id}/api_key/regenerate should reject a non-owner non-admin user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);
    const bot = await seedUser(db, tenantId, {
      email: `bot-${Date.now()}@test.local`,
      isBot: 1,
      botType: 1,
      botOwnerId: admin.userId,
    });

    const getRes = await member.client.get(`/bots/${bot.userId}/api_key`);
    expect(getRes.status).to.equal(400);
    expect(getRes.body.result).to.equal("error");
    expect(getRes.body.msg).to.equal("Insufficient permission");
    expect(getRes.body.code).to.equal("BAD_REQUEST");

    const regenerateRes = await member.client.post(`/bots/${bot.userId}/api_key/regenerate`);
    expect(regenerateRes.status).to.equal(400);
    expect(regenerateRes.body.result).to.equal("error");
    expect(regenerateRes.body.msg).to.equal("Insufficient permission");
    expect(regenerateRes.body.code).to.equal("BAD_REQUEST");
  });

  it("bot api key compat endpoints should reject unknown bot ids", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const getRes = await admin.client.get("/bots/999999/api_key");
    expect(getRes.status).to.equal(400);
    expect(getRes.body.result).to.equal("error");
    expect(getRes.body.msg).to.equal("No such bot");
    expect(getRes.body.code).to.equal("BAD_REQUEST");

    const regenerateRes = await admin.client.post("/bots/999999/api_key/regenerate");
    expect(regenerateRes.status).to.equal(400);
    expect(regenerateRes.body.result).to.equal("error");
    expect(regenerateRes.body.msg).to.equal("No such bot");
    expect(regenerateRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/messages/{message_id}/typing should send message edit typing notifications", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "typing-edit" });
    await seedSubscription(db, tenantId, sender.userId, channelId);
    const messageId = await seedMessage(db, tenantId, sender.userId, {
      channelId,
      topic: "editing",
      content: "Edit me",
    });

    const res = await sender.client.post(`/messages/${messageId}/typing`, {
      op: "start",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });
});
