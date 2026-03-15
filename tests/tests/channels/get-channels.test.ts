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

  it("should return Zulip-compatible stream objects and hide archived streams by default", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId, { role: 100 });
    const activeChannelId = await seedChannel(db, tenantId, {
      name: "compat-stream",
      creatorId: owner.userId,
      isPrivate: 1,
      isWebPublic: 0,
    });
    const archivedChannelId = await seedChannel(db, tenantId, {
      name: "archived-stream",
      creatorId: owner.userId,
    });

    await db("channel").where({ tenant_id: tenantId, id: archivedChannelId }).update({ is_archived: 1 });

    const defaultRes = await owner.client.get("/streams");
    expect(defaultRes.status).to.equal(200);
    const defaultStreams = defaultRes.body.streams as Array<Record<string, unknown>>;
    expect(defaultStreams.some((stream) => stream.stream_id === archivedChannelId)).to.equal(false);

    const includeArchivedRes = await owner.client.get("/streams", { include_archived: "1" });
    expect(includeArchivedRes.status).to.equal(200);
    const streams = includeArchivedRes.body.streams as Array<Record<string, unknown>>;
    const stream = streams.find((entry) => entry.stream_id === activeChannelId);
    const archived = streams.find((entry) => entry.stream_id === archivedChannelId);

    expect(stream).to.not.equal(undefined);
    expect(stream).to.deep.include({
      stream_id: activeChannelId,
      name: "compat-stream",
      description: "",
      rendered_description: "",
      invite_only: true,
      is_web_public: false,
      history_public_to_subscribers: true,
      creator_id: owner.userId,
      message_retention_days: null,
      is_archived: false,
      stream_post_policy: 1,
      is_announcement_only: false,
    });
    expect(stream!.date_created).to.be.a("number");
    expect(stream!.first_message_id).to.equal(null);

    expect(archived).to.not.equal(undefined);
    expect(archived!.is_archived).to.equal(true);
    expect(archived!.stream_post_policy).to.equal(1);
    expect(archived!.is_announcement_only).to.equal(false);
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

  it("should return a Zulip-compatible stream payload by id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId, { role: 100 });
    const channelId = await seedChannel(db, tenantId, {
      name: "detailed-stream",
      creatorId: owner.userId,
    });

    const res = await owner.client.get(`/streams/${channelId}`);
    expect(res.status).to.equal(200);

    const stream = res.body.stream as Record<string, unknown>;
    expect(stream).to.deep.include({
      stream_id: channelId,
      name: "detailed-stream",
      description: "",
      rendered_description: "",
      invite_only: false,
      is_web_public: false,
      history_public_to_subscribers: true,
      creator_id: owner.userId,
      message_retention_days: null,
      is_archived: false,
      stream_post_policy: 1,
      is_announcement_only: false,
    });
    expect(stream.date_created).to.be.a("number");
    expect(stream.first_message_id).to.equal(null);
  });

  it("should return error for non-existent stream ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/streams/nonexistent_id_999");
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 404]);
    expect(res.body.code).to.equal("BAD_REQUEST");
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
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});
