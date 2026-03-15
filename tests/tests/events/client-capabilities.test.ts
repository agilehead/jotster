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

describe("Client capability event compatibility", function () {
  this.timeout(20000);

  it("should suppress stream typing events unless stream_typing_notifications support is declared", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "typing-capability",
    });
    await seedSubscription(db, tenantId, sender.userId, channelId);

    const legacyQueue = await registerQueue(sender.client, ["typing"]);
    const capableQueue = await registerQueue(sender.client, ["typing"], {
      stream_typing_notifications: true,
    });

    const typingRes = await sender.client.post("/typing", {
      type: "stream",
      op: "start",
      stream_id: channelId,
      topic: "Capability topic",
    });
    expect(typingRes.status).to.equal(200);

    const legacyEvents = await getEvents(
      sender.client,
      legacyQueue.queueId,
      legacyQueue.lastEventId,
    );
    expect(legacyEvents).to.deep.equal([]);

    const capableEvents = await getEvents(
      sender.client,
      capableQueue.queueId,
      capableQueue.lastEventId,
    );
    expect(capableEvents).to.have.length(1);
    expect(capableEvents[0]).to.deep.equal({
      id: capableEvents[0].id,
      type: "typing",
      op: "start",
      sender: {
        user_id: sender.userId,
        email: sender.email,
      },
      stream_id: channelId,
      topic: "Capability topic",
    });
  });

  it("should continue sending direct typing events without stream typing capability support", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);
    const queue = await registerQueue(recipient.client, ["typing"]);

    const typingRes = await sender.client.post("/typing", {
      type: "direct",
      op: "start",
      to: JSON.stringify([recipient.userId]),
    });
    expect(typingRes.status).to.equal(200);

    const events = await getEvents(
      recipient.client,
      queue.queueId,
      queue.lastEventId,
    );
    expect(events).to.have.length(1);
    expect(events[0]).to.deep.equal({
      id: events[0].id,
      type: "typing",
      op: "start",
      sender: {
        user_id: sender.userId,
        email: sender.email,
      },
      recipients: [recipient.userId],
    });
  });
});
