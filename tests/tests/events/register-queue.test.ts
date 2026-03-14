import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedChannel, seedMessage, seedSubscription, seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/register", function () {
  this.timeout(10000);

  it("should register an event queue", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/register", {
      event_types: JSON.stringify(["message", "subscription"]),
      apply_markdown: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("queue_id");
    expect(res.body.queue_id).to.be.a("string");
    expect(res.body).to.have.property("last_event_id");
    expect(res.body.last_event_id).to.equal(-1);
  });

  it("should register a queue with no event_types (all events)", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/register");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("queue_id");
  });

  it("should return distinct queue_ids for separate registrations", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res1 = await client.post("/register", {
      event_types: JSON.stringify(["message"]),
    });
    const res2 = await client.post("/register", {
      event_types: JSON.stringify(["message"]),
    });

    expect(res1.body.result).to.equal("success");
    expect(res2.body.result).to.equal("success");
    expect(res1.body.queue_id).to.not.equal(res2.body.queue_id);
  });

  it("should return persisted and organization state in the register payload for requested fetch_event_types", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const channelId = await seedChannel(db, tenantId, { name: "register-state" });
    await seedSubscription(db, tenantId, admin.userId, channelId);
    const messageId = await seedMessage(db, tenantId, admin.userId, {
      channelId,
      topic: "register",
      content: "Reminder target",
    });

    const linkifierRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#42",
    });
    expect(linkifierRes.status).to.equal(200);

    const navigationRes = await admin.client.post("/navigation_views", {
      fragment: "narrow/channel/register-state",
      name: "Register state",
      is_pinned: "true",
    });
    expect(navigationRes.status).to.equal(200);

    const snippetRes = await admin.client.post("/saved_snippets", {
      title: "Register snippet",
      content: "const answer = 42;",
    });
    expect(snippetRes.status).to.equal(200);

    const futureReminderTimestamp = String(Math.floor(Date.now() / 1000) + 3600);
    const reminderRes = await admin.client.post("/reminders", {
      message_id: messageId,
      scheduled_delivery_timestamp: futureReminderTimestamp,
      note: "Follow up",
    });
    expect(reminderRes.status).to.equal(200);

    const futureScheduledTimestamp = String(Math.floor(Date.now() / 1000) + 7200);
    const scheduledMessageRes = await admin.client.post("/scheduled_messages", {
      type: "stream",
      to: channelId,
      topic: "register-topic",
      content: "Scheduled later",
      scheduled_delivery_timestamp: futureScheduledTimestamp,
    });
    expect(scheduledMessageRes.status).to.equal(200);

    const groupRes = await admin.client.post("/user_groups/create", {
      name: "register-group",
      description: "Group in register payload",
      members: JSON.stringify([admin.userId]),
    });
    expect(groupRes.status).to.equal(200);
    const groupId = groupRes.body.group.id as string;

    const registerRes = await admin.client.post("/register", {
      fetch_event_types: JSON.stringify([
        "realm",
        "realm_user_groups",
        "navigation_views",
        "saved_snippets",
        "reminders",
        "scheduled_messages",
        "realm_linkifiers",
      ]),
      client_capabilities: JSON.stringify({ linkifier_url_template: true }),
    });

    expect(registerRes.status).to.equal(200);
    expect(registerRes.body.result).to.equal("success");
    expect(registerRes.body.event_queue_longpoll_timeout_seconds).to.equal(90);

    expect(registerRes.body.navigation_views).to.deep.equal([
      {
        fragment: "narrow/channel/register-state",
        is_pinned: true,
        name: "Register state",
      },
    ]);

    expect(registerRes.body.saved_snippets).to.deep.equal([
      {
        id: snippetRes.body.saved_snippet_id,
        title: "Register snippet",
        content: "const answer = 42;",
        date_created: (registerRes.body.saved_snippets as Array<Record<string, unknown>>)[0].date_created,
      },
    ]);

    expect(registerRes.body.reminders).to.deep.equal([
      {
        reminder_id: reminderRes.body.reminder_id,
        type: "private",
        to: [admin.userId],
        content: "Follow up",
        rendered_content: "<p>Follow up</p>",
        scheduled_delivery_timestamp: Number(futureReminderTimestamp),
        failed: false,
        reminder_target_message_id: messageId,
      },
    ]);

    expect(registerRes.body.scheduled_messages).to.deep.equal([
      {
        scheduled_message_id: scheduledMessageRes.body.scheduled_message_id,
        type: "stream",
        to: channelId,
        topic: "register-topic",
        content: "Scheduled later",
        rendered_content: "<p>Scheduled later</p>",
        scheduled_delivery_timestamp: Number(futureScheduledTimestamp),
        failed: false,
      },
    ]);

    const groups = registerRes.body.realm_user_groups as Array<Record<string, unknown>>;
    const createdGroup = groups.find((entry) => entry.id === groupId);
    expect(createdGroup).to.not.equal(undefined);
    expect(createdGroup!.name).to.equal("register-group");
    expect(createdGroup!.description).to.equal("Group in register payload");
    expect(createdGroup!.members).to.deep.equal([admin.userId]);
    expect(createdGroup!.deactivated).to.equal(false);

    expect(registerRes.body.realm_linkifiers).to.deep.equal([
      {
        pattern: "#(?<id>\\d+)",
        url_template: "https://tracker.example.com/{id}",
        id: linkifierRes.body.id,
        example_input: "#42",
        reverse_template: null,
        alternative_url_templates: [],
      },
    ]);
  });

  it("should return an empty realm_linkifiers register payload unless linkifier_url_template support is declared", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const linkifierRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#42",
    });
    expect(linkifierRes.status).to.equal(200);

    const defaultRes = await admin.client.post("/register", {
      fetch_event_types: JSON.stringify(["realm_linkifiers"]),
    });
    expect(defaultRes.status).to.equal(200);
    expect(defaultRes.body.realm_linkifiers).to.deep.equal([]);

    const capableRes = await admin.client.post("/register", {
      fetch_event_types: JSON.stringify(["realm_linkifiers"]),
      client_capabilities: JSON.stringify({ linkifier_url_template: true }),
    });
    expect(capableRes.status).to.equal(200);
    expect(capableRes.body.realm_linkifiers).to.deep.equal([
      {
        pattern: "#(?<id>\\d+)",
        url_template: "https://tracker.example.com/{id}",
        id: linkifierRes.body.id,
        example_input: "#42",
        reverse_template: null,
        alternative_url_templates: [],
      },
    ]);
  });

  it("should omit deactivated groups from register state unless include_deactivated_groups is set", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const createRes = await admin.client.post("/user_groups/create", {
      name: "deactivated-register-group",
      description: "Hidden by default",
    });
    expect(createRes.status).to.equal(200);
    const groupId = createRes.body.group.id as string;

    const deactivateRes = await admin.client.post(`/user_groups/${groupId}/deactivate`);
    expect(deactivateRes.status).to.equal(200);

    const hiddenRes = await admin.client.post("/register", {
      fetch_event_types: JSON.stringify(["realm_user_groups"]),
    });
    expect(hiddenRes.status).to.equal(200);
    expect(
      (hiddenRes.body.realm_user_groups as Array<Record<string, unknown>>).some((entry) => entry.id === groupId),
    ).to.equal(false);

    const visibleRes = await admin.client.post("/register", {
      fetch_event_types: JSON.stringify(["realm_user_groups"]),
      client_capabilities: JSON.stringify({ include_deactivated_groups: true }),
    });
    expect(visibleRes.status).to.equal(200);
    const groups = visibleRes.body.realm_user_groups as Array<Record<string, unknown>>;
    const group = groups.find((entry) => entry.id === groupId);
    expect(group).to.not.equal(undefined);
    expect(group!.deactivated).to.equal(true);
  });
});

describe("DELETE /api/v1/events", function () {
  this.timeout(10000);

  it("should delete a registered event queue", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Register a queue first
    const registerRes = await client.post("/register", {
      event_types: JSON.stringify(["message"]),
    });
    expect(registerRes.body.result).to.equal("success");
    const queueId = registerRes.body.queue_id as string;

    // Delete the queue
    const res = await client.delete("/events", {
      queue_id: queueId,
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when deleting a non-existent queue", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/events", {
      queue_id: "nonexistent-queue-id",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});
