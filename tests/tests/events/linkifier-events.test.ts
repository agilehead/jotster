import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

const registerQueue = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  eventTypes: string[],
  fetchEventTypes?: string[],
  clientCapabilities?: Record<string, unknown>,
): Promise<{ queueId: string; lastEventId: number; body: Record<string, unknown> }> => {
  const body: Record<string, unknown> = {
    event_types: JSON.stringify(eventTypes),
  };
  if (fetchEventTypes !== undefined) {
    body["fetch_event_types"] = JSON.stringify(fetchEventTypes);
  }
  if (clientCapabilities !== undefined) {
    body["client_capabilities"] = JSON.stringify(clientCapabilities);
  }

  const registerRes = await client.post("/register", body);
  expect(registerRes.status).to.equal(200);
  expect(registerRes.body.result).to.equal("success");
  return {
    queueId: registerRes.body.queue_id as string,
    lastEventId: registerRes.body.last_event_id as number,
    body: registerRes.body as Record<string, unknown>,
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

describe("Realm linkifier event compatibility", function () {
  this.timeout(20000);

  it("should emit realm_linkifiers events with the full ordered list for capable clients", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const { queueId, lastEventId } = await registerQueue(
      admin.client,
      ["realm_linkifiers"],
      undefined,
      { linkifier_url_template: true },
    );

    const firstCreateRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#123",
    });
    expect(firstCreateRes.status).to.equal(200);
    const firstId = firstCreateRes.body.id as number;

    const firstCreateEvents = await getEvents(admin.client, queueId, lastEventId);
    expect(firstCreateEvents).to.have.length(1);
    expect(firstCreateEvents[0]).to.deep.equal({
      id: firstCreateEvents[0].id,
      type: "realm_linkifiers",
      realm_linkifiers: [
        {
          pattern: "#(?<id>\\d+)",
          url_template: "https://tracker.example.com/{id}",
          id: firstId,
          example_input: "#123",
          reverse_template: null,
          alternative_url_templates: [],
        },
      ],
    });

    const secondCreateRes = await admin.client.post("/realm/filters", {
      pattern: "BUG-(?<id>\\d+)",
      url_template: "https://bugs.example.com/{id}",
      example_input: "BUG-9",
      reverse_template: "BUG-{id}",
      alternative_url_templates: JSON.stringify(["https://bugs.example.com/ticket/{id}"]),
    });
    expect(secondCreateRes.status).to.equal(200);
    const secondId = secondCreateRes.body.id as number;

    const secondCreateEvents = await getEvents(admin.client, queueId, firstCreateEvents[0].id as number);
    expect(secondCreateEvents).to.have.length(1);
    expect(secondCreateEvents[0]).to.deep.equal({
      id: secondCreateEvents[0].id,
      type: "realm_linkifiers",
      realm_linkifiers: [
        {
          pattern: "#(?<id>\\d+)",
          url_template: "https://tracker.example.com/{id}",
          id: firstId,
          example_input: "#123",
          reverse_template: null,
          alternative_url_templates: [],
        },
        {
          pattern: "BUG-(?<id>\\d+)",
          url_template: "https://bugs.example.com/{id}",
          id: secondId,
          example_input: "BUG-9",
          reverse_template: "BUG-{id}",
          alternative_url_templates: ["https://bugs.example.com/ticket/{id}"],
        },
      ],
    });

    const updateRes = await admin.client.patch(`/realm/filters/${firstId}`, {
      pattern: "#(?<issue>\\d+)",
      url_template: "https://tracker.example.com/{issue}",
      example_input: "#456",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(admin.client, queueId, secondCreateEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "realm_linkifiers",
      realm_linkifiers: [
        {
          pattern: "#(?<issue>\\d+)",
          url_template: "https://tracker.example.com/{issue}",
          id: firstId,
          example_input: "#456",
          reverse_template: null,
          alternative_url_templates: [],
        },
        {
          pattern: "BUG-(?<id>\\d+)",
          url_template: "https://bugs.example.com/{id}",
          id: secondId,
          example_input: "BUG-9",
          reverse_template: "BUG-{id}",
          alternative_url_templates: ["https://bugs.example.com/ticket/{id}"],
        },
      ],
    });

    const reorderRes = await admin.client.patch("/realm/linkifiers", {
      ordered_linkifier_ids: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const reorderEvents = await getEvents(admin.client, queueId, updateEvents[0].id as number);
    expect(reorderEvents).to.have.length(1);
    expect(reorderEvents[0]).to.deep.equal({
      id: reorderEvents[0].id,
      type: "realm_linkifiers",
      realm_linkifiers: [
        {
          pattern: "BUG-(?<id>\\d+)",
          url_template: "https://bugs.example.com/{id}",
          id: secondId,
          example_input: "BUG-9",
          reverse_template: "BUG-{id}",
          alternative_url_templates: ["https://bugs.example.com/ticket/{id}"],
        },
        {
          pattern: "#(?<issue>\\d+)",
          url_template: "https://tracker.example.com/{issue}",
          id: firstId,
          example_input: "#456",
          reverse_template: null,
          alternative_url_templates: [],
        },
      ],
    });

    const deleteRes = await admin.client.delete(`/realm/filters/${secondId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(admin.client, queueId, reorderEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "realm_linkifiers",
      realm_linkifiers: [
        {
          pattern: "#(?<issue>\\d+)",
          url_template: "https://tracker.example.com/{issue}",
          id: firstId,
          example_input: "#456",
          reverse_template: null,
          alternative_url_templates: [],
        },
      ],
    });
  });

  it("should suppress realm_linkifiers state and events for clients without linkifier_url_template support", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const createRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#123",
    });
    expect(createRes.status).to.equal(200);

    const { queueId, lastEventId, body } = await registerQueue(
      admin.client,
      ["realm_linkifiers"],
      ["realm_linkifiers"],
      { linkifier_url_template: false },
    );
    expect(body["realm_linkifiers"]).to.deep.equal([]);

    const secondCreateRes = await admin.client.post("/realm/filters", {
      pattern: "BUG-(?<id>\\d+)",
      url_template: "https://bugs.example.com/{id}",
      example_input: "BUG-9",
    });
    expect(secondCreateRes.status).to.equal(200);

    const events = await getEvents(admin.client, queueId, lastEventId);
    expect(events).to.deep.equal([]);
  });
});
