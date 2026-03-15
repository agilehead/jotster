import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedChannel,
  seedMessage,
  seedSubscription,
  seedTenant,
  seedUser,
} from "../../utils/test-helpers.js";

describe("Message compatibility endpoints", () => {
  it("POST /api/v1/mark_stream_as_read and POST /api/v1/mark_topic_as_read should mark stream and topic messages as read", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "compat-stream" });
    await seedSubscription(db, tenantId, userId, channelId);

    const streamMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "general",
      content: "mark stream",
    });
    const topicMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "specific",
      content: "mark topic",
    });

    const markStreamRes = await client.post("/mark_stream_as_read", { stream_id: channelId });
    expect(markStreamRes.status).to.equal(200);

    const flagRows = await db("message_flag")
      .select("message_id")
      .where({ user_id: userId, flag: "read" });
    expect(flagRows.map((row) => row.message_id)).to.include(streamMessageId);
    expect(flagRows.map((row) => row.message_id)).to.include(topicMessageId);

    await db("message_flag").del();

    const markTopicRes = await client.post("/mark_topic_as_read", {
      stream_id: channelId,
      topic_name: "specific",
    });
    expect(markTopicRes.status).to.equal(200);

    const topicFlagRows = await db("message_flag")
      .select("message_id")
      .where({ user_id: userId, flag: "read" });
    expect(topicFlagRows.map((row) => row.message_id)).to.deep.equal([topicMessageId]);
  });

  it("mark-as-read compat endpoints should validate required fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const missingStreamRes = await seeded.client.post("/mark_stream_as_read");
    expect(missingStreamRes.status).to.equal(400);
    expect(missingStreamRes.body.msg).to.equal("Missing required field: stream_id");
    expect(missingStreamRes.body.code).to.equal("BAD_REQUEST");

    const missingTopicRes = await seeded.client.post("/mark_topic_as_read", {
      stream_id: "stream",
    });
    expect(missingTopicRes.status).to.equal(400);
    expect(missingTopicRes.body.msg).to.equal("Missing required field");
    expect(missingTopicRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/messages/flags/narrow and GET /api/v1/messages/matches_narrow should update flags for a narrow and report matching messages", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "narrow-stream" });
    await seedSubscription(db, tenantId, userId, channelId);

    const matchingMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "incident",
      content: "match me",
    });
    const otherMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "other",
      content: "ignore me",
    });

    const narrow = JSON.stringify([
      { operator: "channel", operand: channelId },
      { operator: "topic", operand: "incident" },
    ]);

    const updateRes = await client.post("/messages/flags/narrow", {
      anchor: matchingMessageId,
      include_anchor: "true",
      num_before: "0",
      num_after: "0",
      narrow,
      op: "add",
      flag: "starred",
    });
    expect(updateRes.status).to.equal(200);
    expect(updateRes.body.processed_count).to.equal(1);

    const matchingRes = await client.get("/messages/matches_narrow", {
      msg_ids: JSON.stringify([matchingMessageId, otherMessageId]),
      narrow,
    });
    expect(matchingRes.status).to.equal(200);
    const messages = matchingRes.body.messages as Record<string, Record<string, unknown>>;
    expect(Object.keys(messages)).to.deep.equal([matchingMessageId]);
    expect(messages[matchingMessageId].match_subject).to.equal("incident");
  });

  it("messages narrow compat endpoints should reject invalid payloads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const missingFlagRes = await seeded.client.post("/messages/flags/narrow", {
      narrow: JSON.stringify([{ operator: "is", operand: "mentioned" }]),
      op: "add",
    });
    expect(missingFlagRes.status).to.equal(400);
    expect(missingFlagRes.body.msg).to.equal("Missing required field");
    expect(missingFlagRes.body.code).to.equal("BAD_REQUEST");

    const invalidMsgIdsRes = await seeded.client.get("/messages/matches_narrow", {
      msg_ids: "not-json",
      narrow: JSON.stringify([{ operator: "is", operand: "mentioned" }]),
    });
    expect(invalidMsgIdsRes.status).to.equal(400);
    expect(invalidMsgIdsRes.body.msg).to.equal("Invalid msg_ids");
    expect(invalidMsgIdsRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/messages/{message_id}/report, POST /api/v1/messages/{message_id}/typing, and GET /thumbnail/status/{realm_id_str}/{filename} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const moderationChannelId = await seedChannel(db, tenantId, { name: "moderation-requests" });
    const sourceChannelId = await seedChannel(db, tenantId, { name: "source" });
    await seedSubscription(db, tenantId, userId, moderationChannelId);
    await seedSubscription(db, tenantId, userId, sourceChannelId);
    const messageId = await seedMessage(db, tenantId, userId, {
      channelId: sourceChannelId,
      topic: "report",
      content: "Needs review",
    });

    const reportRes = await client.post(`/messages/${messageId}/report`, {
      report_type: "spam",
    });
    expect(reportRes.status).to.equal(200);

    const typingRes = await client.post(`/messages/${messageId}/typing`, { op: "start" });
    expect(typingRes.status).to.equal(200);

    const thumbnailRes = await client.getRaw(`/thumbnail/status/${tenantId}/example.png`);
    expect(thumbnailRes.status).to.equal(200);
    expect(thumbnailRes.body.has_thumbnail).to.equal(false);
  });

  it("message report and typing compat endpoints should validate report_type and op", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "moderation-errors" });
    await seedSubscription(db, tenantId, userId, channelId);
    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "report",
      content: "Needs review",
    });

    const missingReportTypeRes = await client.post(`/messages/${messageId}/report`);
    expect(missingReportTypeRes.status).to.equal(400);
    expect(missingReportTypeRes.body.msg).to.equal("Missing report_type");
    expect(missingReportTypeRes.body.code).to.equal("BAD_REQUEST");

    const invalidTypingOpRes = await client.post(`/messages/${messageId}/typing`, { op: "pause" });
    expect(invalidTypingOpRes.status).to.equal(400);
    expect(invalidTypingOpRes.body.msg).to.equal("Invalid op");
    expect(invalidTypingOpRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/messages/render and GET /api/v1/messages/{message_id}/read_receipts should render markdown and return read receipts", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const reader = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "render-and-read-receipts" });
    await seedSubscription(db, tenantId, sender.userId, channelId);
    await seedSubscription(db, tenantId, reader.userId, channelId);

    const renderRes = await sender.client.post("/messages/render", {
      content: "**Rendered** _message_",
    });
    expect(renderRes.status).to.equal(200);
    expect(renderRes.body.result).to.equal("success");
    expect(renderRes.body.rendered).to.be.a("string");
    expect(renderRes.body.rendered).to.contain("Rendered");

    const messageId = await seedMessage(db, tenantId, sender.userId, {
      channelId,
      topic: "receipts",
      content: "Track my readers",
    });
    await db("message_flag").insert({
      user_id: reader.userId,
      message_id: messageId,
      flag: "read",
    });

    const receiptsRes = await sender.client.get(`/messages/${messageId}/read_receipts`);
    expect(receiptsRes.status).to.equal(200);
    expect(receiptsRes.body.result).to.equal("success");
    expect(receiptsRes.body.user_ids).to.deep.equal([reader.userId]);
  });

  it("GET /api/v1/messages/{message_id}/read_receipts should exclude the sender, muted users, and users with disabled read receipts while still including the requester", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const requester = await seedUser(db, tenantId);
    const hidden = await seedUser(db, tenantId);
    const mutedByRequester = await seedUser(db, tenantId);
    const mutedRequester = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "read-receipt-filtering" });
    await seedSubscription(db, tenantId, sender.userId, channelId);
    await seedSubscription(db, tenantId, requester.userId, channelId);
    await seedSubscription(db, tenantId, hidden.userId, channelId);
    await seedSubscription(db, tenantId, mutedByRequester.userId, channelId);
    await seedSubscription(db, tenantId, mutedRequester.userId, channelId);

    const messageId = await seedMessage(db, tenantId, sender.userId, {
      channelId,
      topic: "receipts",
      content: "Visibility test",
    });

    await db("user_setting").where({ user_id: hidden.userId }).update({ send_read_receipts: 0 });
    await db("muted_user").insert({
      id: `muted_${Date.now()}_1`,
      tenant_id: tenantId,
      user_id: requester.userId,
      muted_user_id: mutedByRequester.userId,
      created_at: Date.now(),
    });
    await db("muted_user").insert({
      id: `muted_${Date.now()}_2`,
      tenant_id: tenantId,
      user_id: mutedRequester.userId,
      muted_user_id: requester.userId,
      created_at: Date.now(),
    });

    await db("message_flag").insert([
      { user_id: sender.userId, message_id: messageId, flag: "read" },
      { user_id: requester.userId, message_id: messageId, flag: "read" },
      { user_id: hidden.userId, message_id: messageId, flag: "read" },
      { user_id: mutedByRequester.userId, message_id: messageId, flag: "read" },
      { user_id: mutedRequester.userId, message_id: messageId, flag: "read" },
    ]);

    const receiptsRes = await requester.client.get(`/messages/${messageId}/read_receipts`);
    expect(receiptsRes.status).to.equal(200);
    expect(receiptsRes.body.result).to.equal("success");
    expect(receiptsRes.body.user_ids).to.deep.equal([requester.userId]);
  });

  it("POST /api/v1/messages/render should return BAD_REQUEST when content is missing", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);

    const renderRes = await sender.client.post("/messages/render");

    expect(renderRes.status).to.equal(400);
    expect(renderRes.body.result).to.equal("error");
    expect(renderRes.body.code).to.equal("BAD_REQUEST");
  });
});
