import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("PATCH /api/v1/realm", () => {
  it("should allow admin to update organization settings", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

    const res = await client.patch("/realm", {
      name: "New Org Name",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should reject non-admin from updating organization settings", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 }); // member

    const res = await client.patch("/realm", {
      name: "Hacked Org Name",
    });

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });
});

describe("PATCH /api/v1/realm/user_settings_defaults", () => {
  it("should update realm user setting defaults with Zulip-compatible validation", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

    const res = await client.patch("/realm/user_settings_defaults", {
      twenty_four_hour_time: "true",
      notification_sound: "ding",
      emoji_set: "twitter",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(res.body.ignored_parameters_unsupported).to.deep.equal(["emoji_set"]);

    const row = await db("tenant_user_setting_default").where({ tenant_id: tenantId }).first();
    expect(row.settings_json).to.contain("\"twenty_four_hour_time\":true");
    expect(row.settings_json).to.contain("\"notification_sound\":\"ding\"");
  });

  it("should reject non-admin and invalid realm user setting default updates", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId, { role: 400 });

    const memberRes = await member.client.patch("/realm/user_settings_defaults", {
      twenty_four_hour_time: "true",
    });
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body.msg).to.equal("Must be an organization administrator");
    expect(memberRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const soundRes = await admin.client.patch("/realm/user_settings_defaults", {
      notification_sound: "invalid",
    });
    expect(soundRes.status).to.equal(400);
    expect(soundRes.body.msg).to.equal("Invalid notification sound 'invalid'");

    const batchingRes = await admin.client.patch("/realm/user_settings_defaults", {
      email_notifications_batching_period_seconds: "-1",
    });
    expect(batchingRes.status).to.equal(400);
    expect(batchingRes.body.msg).to.equal("Invalid email batching period: -1 seconds");

    const emojisetRes = await admin.client.patch("/realm/user_settings_defaults", {
      emojiset: "invalid",
    });
    expect(emojisetRes.status).to.equal(400);
    expect(emojisetRes.body.msg).to.equal("Invalid emojiset: Value error, Not in the list of possible values");
  });
});
