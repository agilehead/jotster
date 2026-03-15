import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedChannel,
  seedMessage,
  seedSubscription,
  seedTenant,
  seedUser,
} from "../../utils/test-helpers.js";

describe("Persisted compatibility endpoints", () => {
  it("POST /api/v1/navigation_views, GET /api/v1/navigation_views, PATCH /api/v1/navigation_views/{fragment}, and DELETE /api/v1/navigation_views/{fragment} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const createRes = await client.post("/navigation_views", {
      fragment: "streams/all",
      is_pinned: "true",
      name: "All streams",
    });
    expect(createRes.status).to.equal(200);

    const listRes = await client.get("/navigation_views");
    expect(listRes.status).to.equal(200);
    expect((listRes.body.navigation_views as Array<Record<string, unknown>>)[0].fragment).to.equal("streams/all");

    const updateRes = await client.patch("/navigation_views/streams/all", {
      is_pinned: "false",
      name: "Everything",
    });
    expect(updateRes.status).to.equal(200);

    const deleteRes = await client.delete("/navigation_views/streams/all");
    expect(deleteRes.status).to.equal(200);
  });

  it("POST /api/v1/navigation_views should reject invalid built-in and custom naming combinations", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const builtInNamedRes = await client.post("/navigation_views", {
      fragment: "recent",
      is_pinned: "true",
      name: "Recent view",
    });
    expect(builtInNamedRes.status).to.equal(400);
    expect(builtInNamedRes.body.msg).to.equal("Built-in views cannot have a custom name.");
    expect(builtInNamedRes.body.code).to.equal("BAD_REQUEST");

    const customWithoutNameRes = await client.post("/navigation_views", {
      fragment: "narrow/view",
      is_pinned: "true",
    });
    expect(customWithoutNameRes.status).to.equal(400);
    expect(customWithoutNameRes.body.msg).to.equal("Custom views must have a valid name.");
    expect(customWithoutNameRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/navigation_views and PATCH /api/v1/navigation_views/{fragment} should reject duplicate custom names", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const firstRes = await client.post("/navigation_views", {
      fragment: "narrow/is/alerted",
      is_pinned: "true",
      name: "Alert Words",
    });
    expect(firstRes.status).to.equal(200);

    const duplicateCreateRes = await client.post("/navigation_views", {
      fragment: "narrow/is/attachment",
      is_pinned: "true",
      name: "Alert Words",
    });
    expect(duplicateCreateRes.status).to.equal(400);
    expect(duplicateCreateRes.body.msg).to.equal("Navigation view already exists.");
    expect(duplicateCreateRes.body.code).to.equal("BAD_REQUEST");

    await client.post("/navigation_views", {
      fragment: "narrow/is/attachment",
      is_pinned: "true",
      name: "Attachments",
    });

    const duplicateUpdateRes = await client.patch("/navigation_views/narrow/is/attachment", {
      name: "Alert Words",
      is_pinned: "false",
    });
    expect(duplicateUpdateRes.status).to.equal(400);
    expect(duplicateUpdateRes.body.msg).to.equal("Navigation view already exists.");
    expect(duplicateUpdateRes.body.code).to.equal("BAD_REQUEST");
  });

  it("PATCH /api/v1/navigation_views/{fragment} should return Zulip-compatible not found errors", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.patch("/navigation_views/narrow/is/nonexistent", {
      name: "Missing view",
    });

    expect(res.status).to.equal(404);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Navigation view does not exist.");
    expect(res.body.code).to.equal("NOT_FOUND");
  });

  it("POST /api/v1/saved_snippets, GET /api/v1/saved_snippets, PATCH /api/v1/saved_snippets/{saved_snippet_id}, and DELETE /api/v1/saved_snippets/{saved_snippet_id} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const createRes = await client.post("/saved_snippets", {
      title: "Snippet",
      content: "console.log('hi')",
    });
    expect(createRes.status).to.equal(200);
    const snippetId = createRes.body.saved_snippet_id as number;

    const listRes = await client.get("/saved_snippets");
    expect(listRes.status).to.equal(200);
    expect((listRes.body.saved_snippets as Array<Record<string, unknown>>)[0].id).to.equal(snippetId);

    const updateRes = await client.patch(`/saved_snippets/${snippetId}`, {
      title: "Updated snippet",
      content: "console.log('updated')",
    });
    expect(updateRes.status).to.equal(200);

    const deleteRes = await client.delete(`/saved_snippets/${snippetId}`);
    expect(deleteRes.status).to.equal(200);
  });

  it("POST /api/v1/saved_snippets should reject titles longer than Zulip's limit", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/saved_snippets", {
      title: "A".repeat(120),
      content: "**Welcome** to the organization.",
    });

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("title is too long (limit: 60 characters)");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });

  it("PATCH /api/v1/saved_snippets/{saved_snippet_id} should allow a no-op request", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const createRes = await client.post("/saved_snippets", {
      title: "Snippet",
      content: "console.log('hi')",
    });
    const snippetId = createRes.body.saved_snippet_id as number;

    const res = await client.patch(`/saved_snippets/${snippetId}`);

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("POST /api/v1/reminders, GET /api/v1/reminders, and DELETE /api/v1/reminders/{reminder_id} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "reminders" });
    await seedSubscription(db, tenantId, userId, channelId);
    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "follow-up",
      content: "Reminder message",
    });

    const timestamp = `${Math.floor(Date.now() / 1000) + 3600}`;
    const createRes = await client.post("/reminders", {
      message_id: messageId,
      scheduled_delivery_timestamp: timestamp,
      note: "Follow up",
    });
    expect(createRes.status).to.equal(200);
    const reminderId = createRes.body.reminder_id as number;

    const listRes = await client.get("/reminders");
    expect(listRes.status).to.equal(200);
    const reminders = listRes.body.reminders as Array<Record<string, unknown>>;
    expect(reminders[0].reminder_id).to.equal(reminderId);
    expect(reminders[0].type).to.equal("private");
    expect(reminders[0].to).to.deep.equal([userId]);
    expect(reminders[0].content).to.equal("Follow up");
    expect(reminders[0].reminder_target_message_id).to.equal(messageId);

    const deleteRes = await client.delete(`/reminders/${reminderId}`);
    expect(deleteRes.status).to.equal(200);
  });

  it("GET /api/v1/reminders should return reminders ordered by scheduled_delivery_timestamp ascending", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "reminder-ordering" });
    await seedSubscription(db, tenantId, userId, channelId);
    const firstMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "follow-up",
      content: "Reminder one",
    });
    const secondMessageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "follow-up",
      content: "Reminder two",
    });

    await client.post("/reminders", {
      message_id: secondMessageId,
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
      note: "Later",
    });
    await client.post("/reminders", {
      message_id: firstMessageId,
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
      note: "Sooner",
    });

    const res = await client.get("/reminders");
    expect(res.status).to.equal(200);
    const reminders = res.body.reminders as Array<Record<string, unknown>>;
    expect(reminders).to.have.length(2);
    expect(reminders[0].content).to.equal("Sooner");
    expect(reminders[1].content).to.equal("Later");
    expect((reminders[0].scheduled_delivery_timestamp as number) < (reminders[1].scheduled_delivery_timestamp as number)).to.equal(true);
  });

  it("POST /api/v1/reminders should reject past timestamps and invalid message ids", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "reminders-errors" });
    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "follow-up",
      content: "Reminder message",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const pastRes = await client.post("/reminders", {
      message_id: messageId,
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) - 3600}`,
    });
    expect(pastRes.status).to.equal(400);
    expect(pastRes.body.msg).to.equal("Scheduled delivery time must be in the future.");
    expect(pastRes.body.code).to.equal("BAD_REQUEST");

    const invalidMessageRes = await client.post("/reminders", {
      message_id: 999999,
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
    });
    expect(invalidMessageRes.status).to.equal(400);
    expect(invalidMessageRes.body.msg).to.equal("Invalid message(s)");
    expect(invalidMessageRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/scheduled_messages, GET /api/v1/scheduled_messages, PATCH /api/v1/scheduled_messages/{scheduled_message_id}, and DELETE /api/v1/scheduled_messages/{scheduled_message_id} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const timestamp = `${Math.floor(Date.now() / 1000) + 7200}`;
    const createRes = await sender.client.post("/scheduled_messages", {
      type: "private",
      to: JSON.stringify([recipient.userId]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: timestamp,
    });
    expect(createRes.status).to.equal(200);
    const scheduledMessageId = createRes.body.scheduled_message_id as number;

    const listRes = await sender.client.get("/scheduled_messages");
    expect(listRes.status).to.equal(200);
    expect((listRes.body.scheduled_messages as Array<Record<string, unknown>>)[0].scheduled_message_id).to.equal(scheduledMessageId);

    const updateRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      content: "Updated scheduled hello",
    });
    expect(updateRes.status).to.equal(200);

    const deleteRes = await sender.client.delete(`/scheduled_messages/${scheduledMessageId}`);
    expect(deleteRes.status).to.equal(200);
  });

  it("POST /api/v1/scheduled_messages should reject email recipients for direct messages and timestamps in the past", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const invalidRecipientRes = await sender.client.post("/scheduled_messages", {
      type: "direct",
      to: JSON.stringify([recipient.email]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    expect(invalidRecipientRes.status).to.equal(400);
    expect(invalidRecipientRes.body.msg).to.equal('to["int"] is not an integer');
    expect(invalidRecipientRes.body.code).to.equal("BAD_REQUEST");

    const pastTimestampRes = await sender.client.post("/scheduled_messages", {
      type: "private",
      to: JSON.stringify([recipient.userId]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) - 7200}`,
    });
    expect(pastTimestampRes.status).to.equal(400);
    expect(pastTimestampRes.body.msg).to.equal("Scheduled delivery time must be in the future.");
    expect(pastTimestampRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/scheduled_messages should reject non-existent direct-message users and channels with Zulip-compatible errors", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);

    const invalidUserId = 999999;
    const invalidDirectRes = await sender.client.post("/scheduled_messages", {
      type: "direct",
      to: JSON.stringify([invalidUserId]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    expect(invalidDirectRes.status).to.equal(400);
    expect(invalidDirectRes.body.code).to.equal("BAD_REQUEST");

    const invalidChannelId = 999999;
    const invalidChannelRes = await sender.client.post("/scheduled_messages", {
      type: "stream",
      to: invalidChannelId,
      topic: "Support",
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    expect(invalidChannelRes.status).to.equal(400);
    expect(invalidChannelRes.body.code).to.equal("STREAM_DOES_NOT_EXIST");
  });

  it("GET /api/v1/scheduled_messages should return messages ordered by scheduled_delivery_timestamp with Zulip-compatible shapes", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "scheduled-shapes" });
    await seedSubscription(db, tenantId, sender.userId, channelId);

    await sender.client.post("/scheduled_messages", {
      type: "private",
      to: JSON.stringify([recipient.userId]),
      content: "Direct scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    await sender.client.post("/scheduled_messages", {
      type: "stream",
      to: channelId,
      topic: "Support",
      content: "Stream scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 3600}`,
    });

    const res = await sender.client.get("/scheduled_messages");
    expect(res.status).to.equal(200);
    const scheduledMessages = res.body.scheduled_messages as Array<Record<string, unknown>>;
    expect(scheduledMessages).to.have.length(2);
    expect(scheduledMessages[0].type).to.equal("stream");
    expect(scheduledMessages[0].to).to.equal(channelId);
    expect(scheduledMessages[0].topic).to.equal("Support");
    expect(scheduledMessages[1].type).to.equal("private");
    expect(scheduledMessages[1].to).to.deep.equal([recipient.userId]);
    expect(scheduledMessages[1]).to.not.have.property("topic");
    expect((scheduledMessages[0].scheduled_delivery_timestamp as number) < (scheduledMessages[1].scheduled_delivery_timestamp as number)).to.equal(true);
  });

  it("PATCH /api/v1/scheduled_messages/{scheduled_message_id} should enforce Zulip's mutation preconditions", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "scheduled-errors" });
    await seedSubscription(db, tenantId, sender.userId, channelId);

    const createRes = await sender.client.post("/scheduled_messages", {
      type: "private",
      to: JSON.stringify([recipient.userId]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    const scheduledMessageId = createRes.body.scheduled_message_id as number;

    const noOpRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`);
    expect(noOpRes.status).to.equal(400);
    expect(noOpRes.body.msg).to.equal("Nothing to change");
    expect(noOpRes.body.code).to.equal("BAD_REQUEST");

    const missingRecipientRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      type: "direct",
    });
    expect(missingRecipientRes.status).to.equal(400);
    expect(missingRecipientRes.body.msg).to.equal("Recipient required when updating type of scheduled message.");
    expect(missingRecipientRes.body.code).to.equal("BAD_REQUEST");

    const missingTopicRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      type: "channel",
      to: JSON.stringify([channelId]),
    });
    expect(missingTopicRes.status).to.equal(400);
    expect(missingTopicRes.body.msg).to.equal("Topic required when updating scheduled message type to channel.");
    expect(missingTopicRes.body.code).to.equal("BAD_REQUEST");

    const pastTimestampRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) - 7200}`,
    });
    expect(pastTimestampRes.status).to.equal(400);
    expect(pastTimestampRes.body.msg).to.equal("Scheduled delivery time must be in the future.");
    expect(pastTimestampRes.body.code).to.equal("BAD_REQUEST");
  });

  it("PATCH /api/v1/scheduled_messages/{scheduled_message_id} should reject non-existent direct-message users and channels with Zulip-compatible errors", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const createRes = await sender.client.post("/scheduled_messages", {
      type: "private",
      to: JSON.stringify([recipient.userId]),
      content: "Scheduled hello",
      scheduled_delivery_timestamp: `${Math.floor(Date.now() / 1000) + 7200}`,
    });
    const scheduledMessageId = createRes.body.scheduled_message_id as number;

    const invalidUserId = 999999;
    const invalidDirectRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      type: "direct",
      to: JSON.stringify([invalidUserId]),
    });
    expect(invalidDirectRes.status).to.equal(400);
    expect(invalidDirectRes.body.code).to.equal("BAD_REQUEST");

    const invalidChannelId = 999999;
    const invalidChannelRes = await sender.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      type: "stream",
      to: invalidChannelId,
      topic: "Support",
    });
    expect(invalidChannelRes.status).to.equal(400);
    expect(invalidChannelRes.body.code).to.equal("STREAM_DOES_NOT_EXIST");
  });
});
