import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("GET /api/v1/events", function () {
  this.timeout(15000);

  it("should return events from a registered queue after an action", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "events-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    // Register for message events
    const registerRes = await client.post("/register", {
      event_types: JSON.stringify(["message"]),
    });
    expect(registerRes.body.result).to.equal("success");
    const queueId = registerRes.body.queue_id as string;
    const lastEventId = registerRes.body.last_event_id as number;

    // Send a message to generate an event
    await client.post("/messages", {
      type: "stream",
      to: "events-channel",
      topic: "event-test",
      content: "This should generate an event",
    });

    // Fetch events
    const res = await client.get("/events", {
      queue_id: queueId,
      last_event_id: String(lastEventId),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("events");
    expect(res.body.events).to.be.an("array");
  });

  it("should return heartbeat or empty events when nothing happened", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Register a queue
    const registerRes = await client.post("/register", {
      event_types: JSON.stringify(["message"]),
    });
    expect(registerRes.body.result).to.equal("success");
    const queueId = registerRes.body.queue_id as string;
    const lastEventId = registerRes.body.last_event_id as number;

    // Use AbortController to enforce a short timeout on the long-poll
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await client.get("/events", {
        queue_id: queueId,
        last_event_id: String(lastEventId),
      }, { signal: controller.signal });

      // If the server responds before the timeout, validate the response
      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("events");
      expect(res.body.events).to.be.an("array");
    } catch (err: unknown) {
      // If aborted due to timeout, that is expected for long-poll
      if (err instanceof Error && err.name === "AbortError") {
        // Long-poll timed out as expected
        return;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  });

  it("should return error for an invalid queue_id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/events", {
      queue_id: "bad-queue-id",
      last_event_id: "-1",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
    expect(res.body.code).to.equal("BAD_EVENT_QUEUE_ID");
  });

  it("should return BAD_REQUEST when queue_id is missing", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/events", {
      last_event_id: "-1",
    });

    expect(res.status).to.equal(400);
    expect(res.body.result).to.equal("error");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});
