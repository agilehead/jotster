import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Organization compatibility endpoints", () => {
  it("POST /api/v1/realm/profile_fields and PATCH /api/v1/realm/profile_fields should reorder custom profile fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const first = await client.post("/realm/profile_fields", {
      name: "First",
      hint: "First field",
      field_type: "1",
    });
    const second = await client.post("/realm/profile_fields", {
      name: "Second",
      hint: "Second field",
      field_type: "1",
    });

    const firstId = first.body.id as number;
    const secondId = second.body.id as number;

    const reorderRes = await client.patch("/realm/profile_fields", {
      order: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const rows = await db("custom_profile_field")
      .select("id", "ordering")
      .whereIn("id", [firstId, secondId]);
    const ordering = new Map(
      rows.map((row) => [row.id as number, row.ordering as number]),
    );
    expect(ordering.get(firstId)).to.equal(1);
    expect(ordering.get(secondId)).to.equal(0);
  });

  it("PATCH /api/v1/realm/profile_fields should require an organization administrator and an order payload", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    await admin.client.post("/realm/profile_fields", {
      name: "First",
      hint: "First field",
      field_type: "1",
    });

    const memberRes = await member.client.patch("/realm/profile_fields", {
      order: JSON.stringify(["missing"]),
    });
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body.msg).to.equal(
      "Must be an organization administrator",
    );
    expect(memberRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingOrderRes = await admin.client.patch("/realm/profile_fields");
    expect(missingOrderRes.status).to.equal(400);
    expect(missingOrderRes.body.msg).to.equal("Missing order");
    expect(missingOrderRes.body.code).to.equal("BAD_REQUEST");
  });

  it("POST /api/v1/realm/filters, GET /api/v1/realm/linkifiers, PATCH /api/v1/realm/linkifiers, PATCH /api/v1/realm/filters/{filter_id}, and DELETE /api/v1/realm/filters/{filter_id} should work", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const first = await client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#123",
    });
    const second = await client.post("/realm/filters", {
      pattern: "BUG-(?<id>\\d+)",
      url_template: "https://bugs.example.com/{id}",
      example_input: "BUG-9",
    });

    expect(first.status).to.equal(200);
    expect(second.status).to.equal(200);

    const firstId = first.body.id as number;
    const secondId = second.body.id as number;

    const listRes = await client.get("/realm/linkifiers");
    expect(listRes.status).to.equal(200);
    expect(
      (listRes.body.linkifiers as Array<Record<string, unknown>>).length,
    ).to.equal(2);

    const reorderRes = await client.patch("/realm/linkifiers", {
      ordered_linkifier_ids: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const updateRes = await client.patch(`/realm/filters/${firstId}`, {
      pattern: "#(?<issue>\\d+)",
      url_template: "https://tracker.example.com/{issue}",
      example_input: "#456",
    });
    expect(updateRes.status).to.equal(200);

    const deleteRes = await client.delete(`/realm/filters/${secondId}`);
    expect(deleteRes.status).to.equal(200);
  });

  it("realm linkifier mutation endpoints should enforce admin auth and validation rules", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberCreateRes = await member.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
    });
    expect(memberCreateRes.status).to.equal(400);
    expect(memberCreateRes.body.msg).to.equal(
      "Must be an organization administrator",
    );
    expect(memberCreateRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingFieldRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
    });
    expect(missingFieldRes.status).to.equal(400);
    expect(missingFieldRes.body.msg).to.equal("Missing required field");
    expect(missingFieldRes.body.code).to.equal("BAD_REQUEST");

    const createRes = await admin.client.post("/realm/filters", {
      pattern: "#(?<id>\\d+)",
      url_template: "https://tracker.example.com/{id}",
      example_input: "#123",
    });
    const filterId = createRes.body.id as number;

    const missingOrderRes = await admin.client.patch("/realm/linkifiers");
    expect(missingOrderRes.status).to.equal(400);
    expect(missingOrderRes.body.msg).to.equal("Missing ordered_linkifier_ids");
    expect(missingOrderRes.body.code).to.equal("BAD_REQUEST");

    const memberReorderRes = await member.client.patch("/realm/linkifiers", {
      ordered_linkifier_ids: JSON.stringify([filterId]),
    });
    expect(memberReorderRes.status).to.equal(400);
    expect(memberReorderRes.body.msg).to.equal(
      "Must be an organization administrator",
    );
    expect(memberReorderRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingFilterUpdateRes = await admin.client.patch(
      "/realm/filters/999999",
      {
        pattern: "BUG-(?<id>\\d+)",
      },
    );
    expect(missingFilterUpdateRes.status).to.equal(404);
    expect(missingFilterUpdateRes.body.msg).to.equal(
      "Linkifier does not exist.",
    );
    expect(missingFilterUpdateRes.body.code).to.equal("BAD_REQUEST");

    const memberDeleteRes = await member.client.delete(
      `/realm/filters/${filterId}`,
    );
    expect(memberDeleteRes.status).to.equal(400);
    expect(memberDeleteRes.body.msg).to.equal(
      "Must be an organization administrator",
    );
    expect(memberDeleteRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");
  });

  it("POST /api/v1/realm/test_welcome_bot_custom_message should send a welcome bot custom message test", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/test_welcome_bot_custom_message", {
      welcome_message_custom_text: "Welcome aboard",
    });

    expect(res.status).to.equal(200);
    expect(res.body.message_id).to.be.a("number");
  });

  it("POST /api/v1/realm/test_welcome_bot_custom_message should require admin auth and a message payload", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberRes = await member.client.post(
      "/realm/test_welcome_bot_custom_message",
      {
        welcome_message_custom_text: "Welcome aboard",
      },
    );
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body.msg).to.equal(
      "Must be an organization administrator",
    );
    expect(memberRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingBodyRes = await admin.client.post(
      "/realm/test_welcome_bot_custom_message",
    );
    expect(missingBodyRes.status).to.equal(400);
    expect(missingBodyRes.body.msg).to.equal(
      "Missing welcome_message_custom_text",
    );
    expect(missingBodyRes.body.code).to.equal("BAD_REQUEST");
  });
});
