import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedChannel,
  seedSubscription,
  seedTenant,
  seedUser,
} from "../../utils/test-helpers.js";

const registerQueue = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  eventTypes: string[],
  clientCapabilities?: Record<string, unknown>,
): Promise<{ queueId: string; lastEventId: number }> => {
  const body: Record<string, unknown> = {
    event_types: JSON.stringify(eventTypes),
  };
  if (clientCapabilities !== undefined) {
    body["client_capabilities"] = JSON.stringify(clientCapabilities);
  }

  const registerRes = await client.post("/register", body);
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

describe("User settings event compatibility", function () {
  this.timeout(20000);

  it("should emit user_settings events with Zulip-compatible property and value fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const { queueId, lastEventId } = await registerQueue(user.client, [
      "user_settings",
    ]);

    const res = await user.client.patch("/settings", {
      enable_sounds: "false",
    });
    expect(res.status).to.equal(200);

    const events = await getEvents(user.client, queueId, lastEventId);
    expect(events).to.have.length(1);
    expect(events[0]).to.deep.equal({
      id: events[0].id,
      type: "user_settings",
      property: "enable_sounds",
      value: false,
    });
  });

  it("should include language_name for default_language updates", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const { queueId, lastEventId } = await registerQueue(user.client, [
      "user_settings",
    ]);

    const res = await user.client.patch("/settings", {
      default_language: "es",
    });
    expect(res.status).to.equal(200);

    const events = await getEvents(user.client, queueId, lastEventId);
    expect(events).to.have.length(1);
    expect(events[0]).to.deep.equal({
      id: events[0].id,
      type: "user_settings",
      property: "default_language",
      value: "es",
      language_name: "Spanish",
    });
  });

  it("should suppress stream typing events when the sender disabled send_stream_typing_notifications", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "typing-setting",
    });
    await seedSubscription(db, tenantId, sender.userId, channelId);
    const queue = await registerQueue(sender.client, ["typing"], {
      stream_typing_notifications: true,
    });

    const settingsRes = await sender.client.patch("/settings", {
      send_stream_typing_notifications: "false",
    });
    expect(settingsRes.status).to.equal(200);

    const typingRes = await sender.client.post("/typing", {
      type: "stream",
      op: "start",
      stream_id: channelId,
      topic: "Muted typing",
    });
    expect(typingRes.status).to.equal(200);

    const events = await getEvents(
      sender.client,
      queue.queueId,
      queue.lastEventId,
    );
    expect(events).to.deep.equal([]);
  });
});
