import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/users", () => {
  it("should return all users for the tenant", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    await seedUser(db, tenantId, { fullName: "Alice" });
    const { client } = await seedUser(db, tenantId, { fullName: "Bob" });

    const res = await client.get("/users");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("members");
    expect(res.body.members).to.be.an("array");
    expect((res.body.members as unknown[]).length).to.be.at.least(2);
  });

  it("should not return users from other tenants", async () => {
    const db = testDb.getDb();
    const tenantId1 = await seedTenant(db);
    const tenantId2 = await seedTenant(db);
    const { client } = await seedUser(db, tenantId1, { fullName: "Tenant1 User" });
    await seedUser(db, tenantId2, { fullName: "Tenant2 User" });

    const res = await client.get("/users");
    expect(res.status).to.equal(200);
    const members = res.body.members as Array<Record<string, unknown>>;
    const names = members.map((m) => m.full_name);
    expect(names).to.include("Tenant1 User");
    expect(names).to.not.include("Tenant2 User");
  });

  it("should return Zulip-compatible user objects", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId, {
      fullName: "Owner User",
      role: 100,
      avatarUrl: "https://cdn.test.local/avatar.png",
      isBillingAdmin: 1,
    });
    const guest = await seedUser(db, tenantId, {
      fullName: "Guest User",
      role: 600,
    });

    const res = await owner.client.get("/users");
    expect(res.status).to.equal(200);

    const members = res.body.members as Array<Record<string, unknown>>;
    const ownerEntry = members.find((member) => member.user_id === owner.userId);
    const guestEntry = members.find((member) => member.user_id === guest.userId);

    expect(ownerEntry).to.not.equal(undefined);
    expect(ownerEntry).to.deep.include({
      user_id: owner.userId,
      email: owner.email,
      delivery_email: owner.email,
      full_name: "Owner User",
      role: 100,
      is_active: true,
      is_owner: true,
      is_admin: true,
      is_guest: false,
      is_bot: false,
      bot_type: null,
      bot_owner_id: null,
      timezone: "UTC",
      avatar_url: "https://cdn.test.local/avatar.png",
      avatar_version: 1,
      is_billing_admin: true,
    });
    expect(ownerEntry!.date_joined).to.be.a("number");
    expect(ownerEntry!.profile_data).to.deep.equal({});
    expect(ownerEntry).to.not.have.property("avatar_source");

    expect(guestEntry).to.not.equal(undefined);
    expect(guestEntry).to.deep.include({
      user_id: guest.userId,
      email: guest.email,
      delivery_email: guest.email,
      full_name: "Guest User",
      role: 600,
      is_active: true,
      is_owner: false,
      is_admin: false,
      is_guest: true,
      is_bot: false,
      bot_type: null,
      bot_owner_id: null,
      timezone: "UTC",
      avatar_version: 1,
      is_billing_admin: false,
    });
    expect(guestEntry!.profile_data).to.deep.equal({});
    expect(guestEntry).to.not.have.property("avatar_source");
  });
});

describe("GET /api/v1/users/{user_id}", () => {
  it("should return a specific user by ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, client } = await seedUser(db, tenantId, { fullName: "Target User" });

    const res = await client.get(`/users/${userId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("user");
    expect((res.body.user as Record<string, unknown>).full_name).to.equal("Target User");
  });

  it("should return a Zulip-compatible user payload by id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const owner = await seedUser(db, tenantId, {
      fullName: "Bot Owner",
    });
    const target = await seedUser(db, tenantId, {
      fullName: "Detailed User",
      role: 200,
      isBot: 1,
      botType: 1,
      botOwnerId: owner.userId,
    });

    const res = await target.client.get(`/users/${target.userId}`);
    expect(res.status).to.equal(200);

    const user = res.body.user as Record<string, unknown>;
    expect(user).to.deep.include({
      user_id: target.userId,
      email: target.email,
      delivery_email: target.email,
      full_name: "Detailed User",
      role: 200,
      is_active: true,
      is_owner: false,
      is_admin: true,
      is_guest: false,
      is_bot: true,
      bot_type: 1,
      bot_owner_id: owner.userId,
      timezone: "UTC",
      avatar_version: 1,
      is_billing_admin: false,
      is_imported_stub: false,
    });
    expect(user.profile_data).to.deep.equal({});
    expect(user).to.not.have.property("avatar_source");
  });

  it("should include custom profile data for a user by id and email path", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, { subdomain: "profile-data" });
    const target = await seedUser(db, tenantId, { fullName: "Profile Target" });
    const fieldId = `cpf_${Date.now()}`;
    const valueId = `cpfv_${Date.now()}`;
    const now = Date.now();

    await db("custom_profile_field").insert({
      id: fieldId,
      tenant_id: tenantId,
      name: "Phone number",
      hint: "",
      field_type: 1,
      field_data_json: "{}",
      ordering: 0,
      required: 1,
      editable_by_user: 1,
      use_for_user_matching: 0,
      display_in_profile_summary: 0,
      created_at: now,
    });
    await db("custom_profile_field_value").insert({
      id: valueId,
      tenant_id: tenantId,
      user_id: target.userId,
      field_id: fieldId,
      value: "+1-555-0100",
      rendered_value: "<p>+1-555-0100</p>",
    });

    const byIdRes = await target.client.get(`/users/${target.userId}`);
    expect(byIdRes.status).to.equal(200);
    expect(byIdRes.body.user.is_imported_stub).to.equal(false);
    expect(byIdRes.body.user.profile_data[fieldId]).to.deep.equal({
      value: "+1-555-0100",
      rendered_value: "<p>+1-555-0100</p>",
    });

    const encodedEmail = encodeURIComponent(target.email);
    const byEmailRes = await target.client.get(`/users/${encodedEmail}`);
    expect(byEmailRes.status).to.equal(200);
    expect(byEmailRes.body.user.profile_data[fieldId]).to.deep.equal({
      value: "+1-555-0100",
      rendered_value: "<p>+1-555-0100</p>",
    });
  });

  it("should return error for non-existent user ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/users/nonexistent_id_999");
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 404]);
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});

describe("GET /api/v1/users/me", () => {
  it("should return the authenticated user's own profile", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { userId, email, client } = await seedUser(db, tenantId, { fullName: "My Profile" });

    const res = await client.get("/users/me");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.satisfy((body: Record<string, unknown>) => {
      // Response may have the user info at top level or nested under a key
      return body.email === email || body.full_name === "My Profile" || body.user_id === userId;
    });
  });

  it("should return a Zulip-compatible own-profile payload", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId, {
      fullName: "Compat Profile",
      role: 300,
      avatarUrl: "https://cdn.test.local/me.png",
    });

    const res = await user.client.get("/users/me");
    expect(res.status).to.equal(200);

    expect(res.body).to.deep.include({
      result: "success",
      msg: "",
      user_id: user.userId,
      email: user.email,
      delivery_email: user.email,
      full_name: "Compat Profile",
      role: 300,
      is_active: true,
      is_owner: false,
      is_admin: false,
      is_guest: false,
      is_bot: false,
      bot_type: null,
      bot_owner_id: null,
      timezone: "UTC",
      avatar_url: "https://cdn.test.local/me.png",
      avatar_version: 1,
      is_billing_admin: false,
      is_imported_stub: false,
    });
    expect(res.body.profile_data).to.deep.equal({});
    expect(res.body).to.not.have.property("avatar_source");
  });
});
