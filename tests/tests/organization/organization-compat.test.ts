import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Organization compatibility endpoints", () => {
  it("should reorder custom profile fields", async () => {
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

    const firstId = first.body.id as string;
    const secondId = second.body.id as string;

    const reorderRes = await client.patch("/realm/profile_fields", {
      order: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const rows = await db("custom_profile_field")
      .select("id", "ordering")
      .whereIn("id", [firstId, secondId]);
    const ordering = new Map(rows.map((row) => [row.id as string, row.ordering as number]));
    expect(ordering.get(firstId)).to.equal(1);
    expect(ordering.get(secondId)).to.equal(0);
  });

  it("should create, reorder, update, and delete linkifiers", async () => {
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

    const firstId = first.body.id as string;
    const secondId = second.body.id as string;

    const listRes = await client.get("/realm/linkifiers");
    expect(listRes.status).to.equal(200);
    expect((listRes.body.linkifiers as Array<Record<string, unknown>>).length).to.equal(2);

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

  it("should send a welcome bot custom message test", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/test_welcome_bot_custom_message", {
      welcome_message_custom_text: "Welcome aboard",
    });

    expect(res.status).to.equal(200);
    expect(res.body.message_id).to.be.a("string");
  });
});
