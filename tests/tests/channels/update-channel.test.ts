import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser, seedChannel } from "../../utils/test-helpers.js";

describe("PATCH /api/v1/streams/{stream_id}", () => {
  it("should allow admin to update channel name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });
    const channelId = await seedChannel(db, tenantId, { name: "old-name" });

    const res = await client.patch(`/streams/${channelId}`, {
      new_name: "new-name",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should allow admin to update channel description", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });
    const channelId = await seedChannel(db, tenantId, { name: "desc-channel" });

    const res = await client.patch(`/streams/${channelId}`, {
      description: "Updated description for this channel",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow a regular member to update a channel", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 });
    const channelId = await seedChannel(db, tenantId, { name: "member-no-edit" });

    const res = await client.patch(`/streams/${channelId}`, {
      new_name: "should-not-work",
    });

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should return error for non-existent stream", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.patch("/streams/999999", {
      new_name: "ghost-stream",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});

describe("DELETE /api/v1/streams/{stream_id}", () => {
  it("should allow admin to archive a stream", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });
    const channelId = await seedChannel(db, tenantId, { name: "to-archive" });

    const res = await client.delete(`/streams/${channelId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow a regular member to archive a stream", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 });
    const channelId = await seedChannel(db, tenantId, { name: "no-archive" });

    const res = await client.delete(`/streams/${channelId}`);
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should return error for non-existent stream", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.delete("/streams/999999");
    expect(res.body.result).to.equal("error");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});
