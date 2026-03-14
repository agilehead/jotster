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

  it("POST /api/v1/saved_snippets, GET /api/v1/saved_snippets, PATCH /api/v1/saved_snippets/{saved_snippet_id}, and DELETE /api/v1/saved_snippets/{saved_snippet_id} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const createRes = await client.post("/saved_snippets", {
      title: "Snippet",
      content: "console.log('hi')",
    });
    expect(createRes.status).to.equal(200);
    const snippetId = createRes.body.saved_snippet_id as string;

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
    const reminderId = createRes.body.reminder_id as string;

    const listRes = await client.get("/reminders");
    expect(listRes.status).to.equal(200);
    expect((listRes.body.reminders as Array<Record<string, unknown>>)[0].reminder_id).to.equal(reminderId);

    const deleteRes = await client.delete(`/reminders/${reminderId}`);
    expect(deleteRes.status).to.equal(200);
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
    const scheduledMessageId = createRes.body.scheduled_message_id as string;

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
});
