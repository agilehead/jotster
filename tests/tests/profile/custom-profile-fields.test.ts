import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/realm/profile_fields", () => {
  it("should return all custom profile fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/realm/profile_fields");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("custom_fields");
    expect(res.body.custom_fields).to.be.an("array");
  });
});

describe("POST /api/v1/realm/profile_fields", () => {
  it("should create a short text profile field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/profile_fields", {
      name: "GitHub Username",
      hint: "Enter your GitHub handle",
      field_type: "1",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("id");
  });

  it("should create a long text profile field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/profile_fields", {
      name: "Bio",
      hint: "Tell us about yourself",
      field_type: "2",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("id");
  });

  it("should reject creating a field without a name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/profile_fields", {
      hint: "Some hint",
      field_type: "1",
    });

    expect(res.body.result).to.equal("error");
  });
});

describe("PATCH /api/v1/realm/profile_fields/:field_id", () => {
  it("should update an existing profile field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    // Create a field first
    const createRes = await client.post("/realm/profile_fields", {
      name: "Twitter",
      hint: "Your Twitter handle",
      field_type: "1",
    });
    const fieldId = createRes.body.id;

    // Update it
    const res = await client.patch(`/realm/profile_fields/${fieldId}`, {
      name: "X (Twitter)",
      hint: "Your X handle",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("DELETE /api/v1/realm/profile_fields/:field_id", () => {
  it("should delete an existing profile field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    // Create a field first
    const createRes = await client.post("/realm/profile_fields", {
      name: "LinkedIn",
      hint: "Your LinkedIn profile",
      field_type: "1",
    });
    const fieldId = createRes.body.id;

    // Delete it
    const res = await client.delete(`/realm/profile_fields/${fieldId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when deleting a non-existent field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.delete("/realm/profile_fields/nonexistent_id");
    expect(res.body.result).to.equal("error");
  });
});
