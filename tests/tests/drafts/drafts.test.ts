import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/drafts", () => {
  it("should create a new channel draft", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    const drafts = [
      {
        type: "stream",
        to: [channelId],
        topic: "test topic",
        content: "Draft message content",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ];

    const res = await client.post("/drafts", {
      drafts: JSON.stringify(drafts),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("ids");
    expect(res.body.ids).to.be.an("array").with.length(1);
  });

  it("should create a new direct message draft", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const sender = await seedUser(db, tenantId);
    const recipient = await seedUser(db, tenantId);

    const drafts = [
      {
        type: "private",
        to: [recipient.userId],
        topic: "",
        content: "Hey, are you free?",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ];

    const res = await sender.client.post("/drafts", {
      drafts: JSON.stringify(drafts),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("ids");
  });
});

describe("GET /api/v1/drafts", () => {
  it("should return all drafts for the user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    // Create a draft first
    const drafts = [
      {
        type: "stream",
        to: [channelId],
        topic: "test topic",
        content: "Draft content",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ];
    await client.post("/drafts", { drafts: JSON.stringify(drafts) });

    const res = await client.get("/drafts");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("drafts");
    expect(res.body.drafts).to.be.an("array");
  });

  it("should return empty drafts array when user has no drafts", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/drafts");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.drafts).to.be.an("array").with.length(0);
  });
});

describe("PATCH /api/v1/drafts/{draft_id}", () => {
  it("should update an existing draft", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    // Create a draft
    const drafts = [
      {
        type: "stream",
        to: [channelId],
        topic: "test topic",
        content: "Original draft",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ];
    const createRes = await client.post("/drafts", {
      drafts: JSON.stringify(drafts),
    });
    const draftId = (createRes.body.ids as number[])[0];

    // Update the draft
    const updatedDraft = {
      type: "stream",
      to: [channelId],
      topic: "updated topic",
      content: "Updated draft content",
      timestamp: Math.floor(Date.now() / 1000),
    };
    const res = await client.patch(`/drafts/${draftId}`, {
      draft: JSON.stringify(updatedDraft),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("DELETE /api/v1/drafts/{draft_id}", () => {
  it("should delete an existing draft", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId);
    await seedSubscription(db, tenantId, userId, channelId);

    // Create a draft
    const drafts = [
      {
        type: "stream",
        to: [channelId],
        topic: "test topic",
        content: "Draft to delete",
        timestamp: Math.floor(Date.now() / 1000),
      },
    ];
    const createRes = await client.post("/drafts", {
      drafts: JSON.stringify(drafts),
    });
    const draftId = (createRes.body.ids as number[])[0];

    // Delete the draft
    const res = await client.delete(`/drafts/${draftId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when deleting a non-existent draft", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/drafts/999999");
    expect(res.body.result).to.equal("error");
  });
});
