import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("User compatibility endpoints", () => {
  it("should get and update a user by email path", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId, { fullName: "Original Name" });
    const encodedEmail = encodeURIComponent(member.email);

    const getRes = await admin.client.get(`/users/${encodedEmail}`);
    expect(getRes.status).to.equal(200);
    expect((getRes.body.user as Record<string, unknown>).email).to.equal(member.email);

    const patchRes = await admin.client.patch(`/users/${encodedEmail}`, {
      full_name: "Updated Name",
    });
    expect(patchRes.status).to.equal(200);

    const getUpdatedRes = await admin.client.get(`/users/${encodedEmail}`);
    expect((getUpdatedRes.body.user as Record<string, unknown>).full_name).to.equal("Updated Name");
  });

  it("should update another user's status by user id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const postRes = await admin.client.post(`/users/${member.userId}/status`, {
      status_text: "reviewing",
      emoji_name: "working_on_it",
      emoji_code: "1f6e0",
      reaction_type: "unicode_emoji",
    });
    expect(postRes.status).to.equal(200);

    const getRes = await admin.client.get(`/users/${member.userId}/status`);
    expect(getRes.status).to.equal(200);
    expect((getRes.body.status as Record<string, unknown>).status_text).to.equal("reviewing");
  });

  it("should get and regenerate a bot API key", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const bot = await seedUser(db, tenantId, {
      email: `bot-${Date.now()}@test.local`,
      isBot: 1,
      botType: 1,
      botOwnerId: admin.userId,
    });

    const getRes = await admin.client.get(`/bots/${bot.userId}/api_key`);
    expect(getRes.status).to.equal(200);
    const originalKey = getRes.body.api_key as string;
    expect(originalKey).to.be.a("string").and.not.equal("");

    const regenerateRes = await admin.client.post(`/bots/${bot.userId}/api_key/regenerate`);
    expect(regenerateRes.status).to.equal(200);
    const regeneratedKey = regenerateRes.body.api_key as string;
    expect(regeneratedKey).to.be.a("string").and.not.equal("");
    expect(regeneratedKey).to.not.equal(originalKey);
  });
});
