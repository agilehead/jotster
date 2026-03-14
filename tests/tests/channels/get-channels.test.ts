import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser, seedChannel, seedSubscription } from "../../utils/test-helpers.js";

describe("GET /api/v1/streams", () => {
  it("should return all streams for the tenant", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    await seedChannel(db, tenantId, { name: "general" });
    await seedChannel(db, tenantId, { name: "random" });

    const res = await client.get("/streams");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("streams");
    expect(res.body.streams).to.be.an("array");
    expect((res.body.streams as unknown[]).length).to.be.at.least(2);
  });

  it("should not return streams from other tenants", async () => {
    const db = testDb.getDb();
    const tenantId1 = await seedTenant(db);
    const tenantId2 = await seedTenant(db);
    const { client } = await seedUser(db, tenantId1);
    await seedChannel(db, tenantId1, { name: "tenant1-channel" });
    await seedChannel(db, tenantId2, { name: "tenant2-channel" });

    const res = await client.get("/streams");
    expect(res.status).to.equal(200);
    const streams = res.body.streams as Array<Record<string, unknown>>;
    const names = streams.map((s) => s.name);
    expect(names).to.include("tenant1-channel");
    expect(names).to.not.include("tenant2-channel");
  });
});

describe("GET /api/v1/streams/{stream_id}", () => {
  it("should return a specific stream by ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "specific-stream" });

    const res = await client.get(`/streams/${channelId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("stream");
  });

  it("should return error for non-existent stream ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/streams/nonexistent_id_999");
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 404]);
  });
});

describe("GET /api/v1/get_stream_id", () => {
  it("should look up a stream ID by name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "lookup-me" });

    const res = await client.get("/get_stream_id", { stream: "lookup-me" });
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("stream_id");
    expect(res.body.stream_id).to.equal(channelId);
  });

  it("should return error for non-existent stream name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/get_stream_id", { stream: "does-not-exist" });
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 404]);
  });
});
