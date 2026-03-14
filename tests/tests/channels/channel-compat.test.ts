import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedChannel, seedMessage, seedSubscription, seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Channel compatibility endpoints", () => {
  it("should create and reorder channel folders via Zulip-compatible routes", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const folderOne = await client.post("/channel_folders/create", { name: "alpha" });
    const folderTwo = await client.post("/channel_folders/create", { name: "beta" });

    expect(folderOne.status).to.equal(200);
    expect(folderTwo.status).to.equal(200);

    const firstId = folderOne.body.channel_folder_id as string;
    const secondId = folderTwo.body.channel_folder_id as string;

    const reorderRes = await client.patch("/channel_folders", {
      order: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const rows = await db("channel_folder")
      .select("id", "ordering")
      .whereIn("id", [firstId, secondId]);
    const ordering = new Map(rows.map((row) => [row.id as string, row.ordering as number]));
    expect(ordering.get(firstId)).to.equal(1);
    expect(ordering.get(secondId)).to.equal(0);
  });

  it("should return a stream email address and delete a topic", async () => {
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

  it("should add and remove a default stream via Zulip-compatible routes", async () => {
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

  it("should return stream members and topic summaries for a subscribed user", async () => {
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
    expect(olderMessageId).to.be.a("string");

    const membersRes = await owner.client.get(`/streams/${channelId}/members`);
    expect(membersRes.status).to.equal(200);
    expect((membersRes.body.subscribers as string[]).slice().sort()).to.deep.equal([owner.userId, other.userId].sort());

    const topicsRes = await owner.client.get(`/users/me/${channelId}/topics`);
    expect(topicsRes.status).to.equal(200);
    const topics = topicsRes.body.topics as Array<Record<string, unknown>>;
    expect(topics).to.have.length(2);
    expect(topics[0].name).to.equal("random");
    expect(topics[0].max_id).to.equal(secondTopicId);
    expect(topics[1].name).to.equal("announcements");
    expect(topics[1].max_id).to.equal(newerMessageId);
  });

  it("should update muted topics through the subscriptions muted_topics compatibility route", async () => {
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
});
