import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedChannel, seedMessage, seedSubscription, seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Channel compatibility endpoints", () => {
  it("POST /api/v1/channel_folders/create and PATCH /api/v1/channel_folders should create and reorder channel folders", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const folderOne = await client.post("/channel_folders/create", { name: "alpha", description: "Alpha folder" });
    const folderTwo = await client.post("/channel_folders/create", { name: "beta", description: "Beta folder" });

    expect(folderOne.status).to.equal(200);
    expect(folderTwo.status).to.equal(200);

    const firstId = folderOne.body.channel_folder_id as number;
    const secondId = folderTwo.body.channel_folder_id as number;

    const reorderRes = await client.patch("/channel_folders", {
      order: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const rows = await db("channel_folder")
      .select("id", "ordering")
      .whereIn("id", [firstId, secondId]);
    const ordering = new Map(rows.map((row) => [row.id as number, row.ordering as number]));
    expect(ordering.get(firstId)).to.equal(1);
    expect(ordering.get(secondId)).to.equal(0);
  });

  it("channel folder compat endpoints should enforce admin auth and validate the order payload", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberCreateRes = await member.client.post("/channel_folders/create", {
      name: "member-folder",
      description: "Member folder",
    });
    expect(memberCreateRes.status).to.equal(400);
    expect(memberCreateRes.body.msg).to.equal("Must be an organization administrator");
    expect(memberCreateRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const folderRes = await admin.client.post("/channel_folders/create", {
      name: "admin-folder",
      description: "Admin folder",
    });
    const folderId = folderRes.body.channel_folder_id as number;

    const memberReorderRes = await member.client.patch("/channel_folders", {
      order: JSON.stringify([folderId]),
    });
    expect(memberReorderRes.status).to.equal(400);
    expect(memberReorderRes.body.msg).to.equal("Must be an organization administrator");
    expect(memberReorderRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingOrderRes = await admin.client.patch("/channel_folders", {
      order: "not-json",
    });
    expect(missingOrderRes.status).to.equal(400);
    expect(missingOrderRes.body.msg).to.equal("Invalid order mapping");
    expect(missingOrderRes.body.code).to.equal("BAD_REQUEST");
  });

  it("GET /api/v1/streams/{stream_id}/email_address and POST /api/v1/streams/{stream_id}/delete_topic should return an email address and delete a topic", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, { subdomain: "compat-mail" });
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "support" });
    await seedSubscription(db, tenantId, userId, channelId);

    const emailRes = await client.get(`/streams/${channelId}/email_address`);
    expect(emailRes.status).to.equal(200);
    expect(emailRes.body.email_address).to.equal(`channel-${channelId}@compat-mail.jotster.local`);

    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "cleanup",
      content: "Delete me",
    });
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "cleanup",
      content: "Delete me too",
    });

    const deleteRes = await client.post(`/streams/${channelId}/delete_topic`, {
      topic_name: "cleanup",
    });
    expect(deleteRes.status).to.equal(200);
    expect(deleteRes.body.complete).to.equal(true);

    const remaining = await db("message").where({ tenant_id: tenantId, channel_id: channelId, topic: "cleanup" });
    expect(remaining).to.have.length(0);
  });

  it("stream email and delete-topic compat endpoints should reject invalid channels and missing topic names", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const emailRes = await seeded.client.get("/streams/999999/email_address");
    expect(emailRes.status).to.equal(400);
    expect(emailRes.body.code).to.equal("BAD_REQUEST");

    const missingTopicRes = await seeded.client.post("/streams/999999/delete_topic");
    expect(missingTopicRes.status).to.equal(400);
    expect(missingTopicRes.body.code).to.equal("BAD_REQUEST");

    const invalidChannelRes = await seeded.client.post("/streams/999999/delete_topic", {
      topic_name: "cleanup",
    });
    expect(invalidChannelRes.status).to.equal(400);
    expect(invalidChannelRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/default_streams and DELETE /api/v1/default_streams should add and remove a default stream", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const channelId = await seedChannel(db, tenantId, { name: "default-stream" });

    const addRes = await admin.client.post("/default_streams", { stream_id: channelId });
    expect(addRes.status).to.equal(200);
    expect(addRes.body.result).to.equal("success");

    const inserted = await db("default_channel").where({ tenant_id: tenantId, channel_id: channelId });
    expect(inserted).to.have.length(1);

    const duplicateRes = await admin.client.post("/default_streams", { stream_id: channelId });
    expect(duplicateRes.status).to.equal(400);
    expect(duplicateRes.body.result).to.equal("error");

    const removeRes = await admin.client.delete("/default_streams", { stream_id: channelId });
    expect(removeRes.status).to.equal(200);
    expect(removeRes.body.result).to.equal("success");

    const remaining = await db("default_channel").where({ tenant_id: tenantId, channel_id: channelId });
    expect(remaining).to.have.length(0);
  });

  it("GET /api/v1/streams/{stream_id}/members and GET /api/v1/users/me/{stream_id}/topics should return stream members and topic summaries", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId);
    const other = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "members-and-topics", isPrivate: 1 });
    await seedSubscription(db, tenantId, owner.userId, channelId);
    await seedSubscription(db, tenantId, other.userId, channelId);

    const olderMessageId = await seedMessage(db, tenantId, owner.userId, {
      channelId,
      topic: "announcements",
      content: "older topic message",
    });
    const newerMessageId = await seedMessage(db, tenantId, owner.userId, {
      channelId,
      topic: "announcements",
      content: "newer topic message",
    });
    const secondTopicId = await seedMessage(db, tenantId, other.userId, {
      channelId,
      topic: "random",
      content: "random topic message",
    });
    await db("message").where({ id: olderMessageId }).update({ created_at: 1000 });
    await db("message").where({ id: newerMessageId }).update({ created_at: 2000 });
    await db("message").where({ id: secondTopicId }).update({ created_at: 3000 });
    expect(olderMessageId).to.be.a("number");

    const membersRes = await owner.client.get(`/streams/${channelId}/members`);
    expect(membersRes.status).to.equal(200);
    expect(membersRes.body.result).to.equal("success");
    expect(membersRes.body.msg).to.equal("");
    expect((membersRes.body.subscribers as number[]).slice().sort()).to.deep.equal([owner.userId, other.userId].sort());

    const topicsRes = await owner.client.get(`/users/me/${channelId}/topics`);
    expect(topicsRes.status).to.equal(200);
    expect(topicsRes.body.result).to.equal("success");
    expect(topicsRes.body.msg).to.equal("");
    const topics = topicsRes.body.topics as Array<Record<string, unknown>>;
    expect(topics).to.have.length(2);
    expect(topics[0].name).to.equal("random");
    expect(topics[0].max_id).to.equal(secondTopicId);
    expect(topics[1].name).to.equal("announcements");
    expect(topics[1].max_id).to.equal(newerMessageId);
  });

  it("PATCH /api/v1/users/me/subscriptions/muted_topics should update muted topics", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "muted-topics" });
    await seedSubscription(db, tenantId, seeded.userId, channelId);

    const muteRes = await seeded.client.patch("/users/me/subscriptions/muted_topics", {
      op: "add",
      stream_id: channelId,
      topic: "announcements",
    });
    expect(muteRes.status).to.equal(200);
    expect(muteRes.body.result).to.equal("success");

    const mutedRows = await db("user_topic").where({
      tenant_id: tenantId,
      user_id: seeded.userId,
      channel_id: channelId,
      topic: "announcements",
    });
    expect(mutedRows).to.have.length(1);
    expect(mutedRows[0].visibility_policy).to.equal(1);

    const unmuteRes = await seeded.client.patch("/users/me/subscriptions/muted_topics", {
      op: "remove",
      stream_id: channelId,
      topic: "announcements",
    });
    expect(unmuteRes.status).to.equal(200);
    expect(unmuteRes.body.result).to.equal("success");

    const unmutedRows = await db("user_topic").where({
      tenant_id: tenantId,
      user_id: seeded.userId,
      channel_id: channelId,
      topic: "announcements",
    });
    expect(unmutedRows).to.have.length(0);
  });

  it("PATCH /api/v1/users/me/subscriptions/muted_topics should validate visibility policy inputs", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "muted-topics-errors" });
    await seedSubscription(db, tenantId, seeded.userId, channelId);

    const invalidOpRes = await seeded.client.patch("/users/me/subscriptions/muted_topics", {
      op: "invalid",
      stream_id: channelId,
      topic: "announcements",
    });
    expect(invalidOpRes.status).to.equal(400);
    expect(invalidOpRes.body.msg).to.equal("Invalid op: must be 'add' or 'remove'");

    const invalidChannelRes = await seeded.client.patch("/users/me/subscriptions/muted_topics", {
      op: "add",
      stream_id: 999999,
      topic: "announcements",
    });
    expect(invalidChannelRes.status).to.equal(400);
  });
});
