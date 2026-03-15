import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedChannel,
  seedMessage,
  seedSubscription,
  seedTenant,
  seedUser,
} from "../../utils/test-helpers.js";

const registerQueue = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  eventTypes: string[],
): Promise<{ queueId: string; lastEventId: number }> => {
  const registerRes = await client.post("/register", {
    event_types: JSON.stringify(eventTypes),
  });

  expect(registerRes.status).to.equal(200);
  expect(registerRes.body.result).to.equal("success");

  return {
    queueId: registerRes.body.queue_id as string,
    lastEventId: registerRes.body.last_event_id as number,
  };
};

const getEvents = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  queueId: string,
  lastEventId: number,
): Promise<Array<Record<string, unknown>>> => {
  const res = await client.get("/events", {
    queue_id: queueId,
    last_event_id: String(lastEventId),
    dont_block: "true",
  });

  expect(res.status).to.equal(200);
  expect(res.body.result).to.equal("success");
  return res.body.events as Array<Record<string, unknown>>;
};

describe("Persisted object event compatibility", function () {
  this.timeout(15000);

  it("should emit Zulip-compatible navigation_view add/update/remove events", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const { queueId, lastEventId } = await registerQueue(admin.client, ["navigation_view"]);

    const createRes = await admin.client.post("/navigation_views", {
      fragment: "narrow/is/alerted",
      is_pinned: "true",
      name: "Alert Words",
    });
    expect(createRes.status).to.equal(200);

    const createEvents = await getEvents(admin.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "navigation_view",
      op: "add",
      navigation_view: {
        fragment: "narrow/is/alerted",
        is_pinned: true,
        name: "Alert Words",
      },
    });

    const updateRes = await admin.client.patch("/navigation_views/narrow/is/alerted", {
      is_pinned: "false",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(admin.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "navigation_view",
      op: "update",
      fragment: "narrow/is/alerted",
      data: {
        is_pinned: false,
      },
    });

    const deleteRes = await admin.client.delete("/navigation_views/narrow/is/alerted");
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(admin.client, queueId, updateEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "navigation_view",
      op: "remove",
      fragment: "narrow/is/alerted",
    });
  });

  it("should emit Zulip-compatible saved_snippets add/update/remove events", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const { queueId, lastEventId } = await registerQueue(user.client, ["saved_snippets"]);

    const createRes = await user.client.post("/saved_snippets", {
      title: "Example",
      content: "Welcome to the organization.",
    });
    expect(createRes.status).to.equal(200);
    const snippetId = createRes.body.saved_snippet_id as string;

    const createEvents = await getEvents(user.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    const createdSavedSnippet = createEvents[0].saved_snippet as Record<string, unknown>;
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "saved_snippets",
      op: "add",
      saved_snippet: {
        id: snippetId,
        title: "Example",
        content: "Welcome to the organization.",
        date_created: createdSavedSnippet["date_created"],
      },
    });

    const updateRes = await user.client.patch(`/saved_snippets/${snippetId}`, {
      title: "Updated Example",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(user.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    const updatedSavedSnippet = updateEvents[0].saved_snippet as Record<string, unknown>;
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "saved_snippets",
      op: "update",
      saved_snippet: {
        id: snippetId,
        title: "Updated Example",
        content: "Welcome to the organization.",
        date_created: updatedSavedSnippet["date_created"],
      },
    });

    const deleteRes = await user.client.delete(`/saved_snippets/${snippetId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(user.client, queueId, updateEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "saved_snippets",
      op: "remove",
      saved_snippet_id: snippetId,
    });
  });

  it("should emit Zulip-compatible reminders add/remove events", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "reminders-events" });
    await seedSubscription(db, tenantId, user.userId, channelId);
    const messageId = await seedMessage(db, tenantId, user.userId, {
      channelId,
      topic: "reminders",
      content: "Reminder target",
    });
    const { queueId, lastEventId } = await registerQueue(user.client, ["reminders"]);

    const scheduledDeliveryTimestamp = String(Math.floor(Date.now() / 1000) + 3600);
    const createRes = await user.client.post("/reminders", {
      message_id: messageId,
      scheduled_delivery_timestamp: scheduledDeliveryTimestamp,
      note: "Remember this",
    });
    expect(createRes.status).to.equal(200);
    const reminderId = createRes.body.reminder_id as string;

    const createEvents = await getEvents(user.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "reminders",
      op: "add",
      reminders: [
        {
          reminder_id: reminderId,
          type: "private",
          to: [user.userId],
          content: "Remember this",
          rendered_content: "<p>Remember this</p>",
          scheduled_delivery_timestamp: Number(scheduledDeliveryTimestamp),
          failed: false,
          reminder_target_message_id: messageId,
        },
      ],
    });

    const deleteRes = await user.client.delete(`/reminders/${reminderId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(user.client, queueId, createEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "reminders",
      op: "remove",
      reminder_id: reminderId,
    });
  });

  it("should emit Zulip-compatible scheduled_messages add/update/remove events", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "scheduled-events" });
    await seedSubscription(db, tenantId, user.userId, channelId);
    const { queueId, lastEventId } = await registerQueue(user.client, ["scheduled_messages"]);

    const scheduledDeliveryTimestamp = String(Math.floor(Date.now() / 1000) + 3600);
    const createRes = await user.client.post("/scheduled_messages", {
      type: "stream",
      to: channelId,
      topic: "Test topic",
      content: "Stream message",
      scheduled_delivery_timestamp: scheduledDeliveryTimestamp,
    });
    expect(createRes.status).to.equal(200);
    const scheduledMessageId = createRes.body.scheduled_message_id as string;

    const createEvents = await getEvents(user.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "scheduled_messages",
      op: "add",
      scheduled_messages: [
        {
          scheduled_message_id: scheduledMessageId,
          type: "stream",
          to: channelId,
          topic: "Test topic",
          content: "Stream message",
          rendered_content: "<p>Stream message</p>",
          scheduled_delivery_timestamp: Number(scheduledDeliveryTimestamp),
          failed: false,
        },
      ],
    });

    const updatedScheduledDeliveryTimestamp = String(Math.floor(Date.now() / 1000) + 7200);
    const updateRes = await user.client.patch(`/scheduled_messages/${scheduledMessageId}`, {
      topic: "Edited topic",
      content: "Edited stream message",
      scheduled_delivery_timestamp: updatedScheduledDeliveryTimestamp,
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(user.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "scheduled_messages",
      op: "update",
      scheduled_message: {
        scheduled_message_id: scheduledMessageId,
        type: "stream",
        to: channelId,
        topic: "Edited topic",
        content: "Edited stream message",
        rendered_content: "<p>Edited stream message</p>",
        scheduled_delivery_timestamp: Number(updatedScheduledDeliveryTimestamp),
        failed: false,
      },
    });

    const deleteRes = await user.client.delete(`/scheduled_messages/${scheduledMessageId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(user.client, queueId, updateEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "scheduled_messages",
      op: "remove",
      scheduled_message_id: scheduledMessageId,
    });
  });
});
