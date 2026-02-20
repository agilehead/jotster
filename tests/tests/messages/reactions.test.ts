import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedTenant,
  seedUser,
  seedChannel,
  seedSubscription,
  seedMessage,
} from "../../utils/test-helpers.js";

describe("POST /api/v1/messages/:message_id/reactions", function () {
  this.timeout(10000);

  it("should add a unicode emoji reaction to a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "reaction-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "reactions",
      content: "React to this!",
    });

    const res = await client.post(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow duplicate reactions from the same user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "dup-reaction-channel",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "reactions",
      content: "Double react?",
    });

    // Add reaction first time
    await client.post(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    // Try adding the same reaction again
    const res = await client.post(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});

describe("DELETE /api/v1/messages/:message_id/reactions", function () {
  this.timeout(10000);

  it("should remove a reaction from a message", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "remove-reaction-ch",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "reactions",
      content: "Remove reaction from this",
    });

    // Add reaction
    await client.post(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    // Remove reaction
    const res = await client.delete(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when removing a reaction that does not exist", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, {
      name: "no-reaction-ch",
    });
    await seedSubscription(db, tenantId, userId, channelId);

    const messageId = await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "reactions",
      content: "No reaction here",
    });

    const res = await client.delete(`/messages/${messageId}/reactions`, {
      emoji_name: "thumbs_up",
      emoji_code: "1f44d",
      reaction_type: "unicode_emoji",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });
});
