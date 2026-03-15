import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/realm/profile_fields", () => {
  it("should return Zulip-compatible custom profile field objects", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    const createRes = await admin.client.post("/realm/profile_fields", {
      name: "GitHub",
      hint: "Your GitHub username",
      field_type: "7",
      field_data: "{\"subtype\":\"github\"}",
      required: "true",
      editable_by_user: "false",
      use_for_user_matching: "true",
      display_in_profile_summary: "true",
    });
    expect(createRes.status).to.equal(200);

    const res = await admin.client.get("/realm/profile_fields");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(res.body.custom_fields).to.deep.equal([
      {
        id: createRes.body.id,
        name: "GitHub",
        hint: "Your GitHub username",
        type: 7,
        field_data: "{\"subtype\":\"github\"}",
        order: 1,
        display_in_profile_summary: true,
        required: true,
        editable_by_user: false,
        use_for_user_matching: true,
      },
    ]);
  });
});

describe("POST /api/v1/realm/profile_fields", () => {
  it("should create a custom profile field with Zulip-compatible metadata", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/realm/profile_fields", {
      name: "Phone number",
      hint: "Work phone",
      field_type: "1",
      required: "true",
      editable_by_user: "false",
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({
      result: "success",
      msg: "",
      id: res.body.id,
    });

    const row = await db("custom_profile_field").where({ id: res.body.id }).first();
    expect(row).to.include({
      name: "Phone number",
      hint: "Work phone",
      field_type: 1,
      required: 1,
      editable_by_user: 0,
      use_for_user_matching: 0,
      display_in_profile_summary: 0,
    });
  });

  it("should validate admin auth and Zulip-compatible field constraints", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberRes = await member.client.post("/realm/profile_fields", {
      name: "Phone",
      field_type: "1",
    });
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body).to.deep.equal({
      result: "error",
      msg: "Must be an organization administrator",
      code: "UNAUTHORIZED_PRINCIPAL",
    });

    const blankLabelRes = await admin.client.post("/realm/profile_fields", {
      name: "",
      field_type: "1",
    });
    expect(blankLabelRes.status).to.equal(400);
    expect(blankLabelRes.body.msg).to.equal("Label cannot be blank.");

    const incompatibleSummaryRes = await admin.client.post("/realm/profile_fields", {
      name: "Mentor",
      field_type: "6",
      display_in_profile_summary: "true",
    });
    expect(incompatibleSummaryRes.status).to.equal(400);
    expect(incompatibleSummaryRes.body.msg).to.equal("Field type not supported for display in profile summary.");

    const incompatibleMatchingRes = await admin.client.post("/realm/profile_fields", {
      name: "Biography",
      field_type: "2",
      use_for_user_matching: "true",
    });
    expect(incompatibleMatchingRes.status).to.equal(400);
    expect(incompatibleMatchingRes.body.msg).to.equal("Field type not supported for use for user matching.");

    const first = await admin.client.post("/realm/profile_fields", {
      name: "Summary 1",
      field_type: "1",
      display_in_profile_summary: "true",
    });
    const second = await admin.client.post("/realm/profile_fields", {
      name: "Summary 2",
      field_type: "1",
      display_in_profile_summary: "true",
    });
    expect(first.status).to.equal(200);
    expect(second.status).to.equal(200);

    const thirdSummaryRes = await admin.client.post("/realm/profile_fields", {
      name: "Summary 3",
      field_type: "1",
      display_in_profile_summary: "true",
    });
    expect(thirdSummaryRes.status).to.equal(400);
    expect(thirdSummaryRes.body.msg).to.equal("Only 2 custom profile fields can be displayed in the profile summary.");

    const duplicateLabelRes = await admin.client.post("/realm/profile_fields", {
      name: "Summary 1",
      field_type: "1",
    });
    expect(duplicateLabelRes.status).to.equal(400);
    expect(duplicateLabelRes.body.msg).to.equal("A field with that label already exists.");
  });
});

describe("PATCH /api/v1/realm/profile_fields/:field_id", () => {
  it("should update custom profile field metadata without resetting omitted flags", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const createRes = await client.post("/realm/profile_fields", {
      name: "Phone",
      hint: "Work phone",
      field_type: "1",
      required: "true",
      editable_by_user: "false",
      use_for_user_matching: "true",
    });
    expect(createRes.status).to.equal(200);

    const res = await client.patch(`/realm/profile_fields/${createRes.body.id}`, {
      name: "Phone number",
      hint: "",
      display_in_profile_summary: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ result: "success", msg: "" });

    const listRes = await client.get("/realm/profile_fields");
    expect(listRes.body.custom_fields).to.deep.equal([
      {
        id: createRes.body.id,
        name: "Phone number",
        hint: "",
        type: 1,
        field_data: "",
        order: 1,
        display_in_profile_summary: true,
        required: true,
        editable_by_user: false,
        use_for_user_matching: true,
      },
    ]);
  });

  it("should return Zulip-compatible errors for invalid updates", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const createRes = await admin.client.post("/realm/profile_fields", {
      name: "Phone",
      field_type: "1",
    });
    expect(createRes.status).to.equal(200);
    const fieldId = createRes.body.id as string;

    const memberRes = await member.client.patch(`/realm/profile_fields/${fieldId}`, {
      name: "Nope",
    });
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body.msg).to.equal("Must be an organization administrator");
    expect(memberRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const missingRes = await admin.client.patch("/realm/profile_fields/9001", {
      name: "Phone number",
    });
    expect(missingRes.status).to.equal(400);
    expect(missingRes.body.msg).to.equal("Field id 9001 not found.");
    expect(missingRes.body.code).to.equal("BAD_REQUEST");

    const invalidRequiredRes = await admin.client.patch(`/realm/profile_fields/${fieldId}`, {
      required: "invalid value",
    });
    expect(invalidRequiredRes.status).to.equal(400);
    expect(invalidRequiredRes.body.msg).to.equal("required is not valid JSON");

    const blankLabelRes = await admin.client.patch(`/realm/profile_fields/${fieldId}`, {
      name: "",
    });
    expect(blankLabelRes.status).to.equal(400);
    expect(blankLabelRes.body.msg).to.equal("Label cannot be blank.");
  });
});

describe("DELETE /api/v1/realm/profile_fields/:field_id", () => {
  it("should delete an existing custom profile field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const createRes = await client.post("/realm/profile_fields", {
      name: "LinkedIn",
      hint: "Your LinkedIn profile",
      field_type: "1",
    });
    const fieldId = createRes.body.id;

    // Delete it
    const res = await client.delete(`/realm/profile_fields/${fieldId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ result: "success", msg: "" });
  });

  it("should return Zulip-compatible errors when deleting a non-existent field", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const memberRes = await member.client.delete("/realm/profile_fields/9001");
    expect(memberRes.status).to.equal(400);
    expect(memberRes.body.msg).to.equal("Must be an organization administrator");
    expect(memberRes.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");

    const res = await admin.client.delete("/realm/profile_fields/9001");
    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({
      result: "error",
      msg: "Field id 9001 not found.",
      code: "BAD_REQUEST",
    });
  });
});
