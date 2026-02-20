import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

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
