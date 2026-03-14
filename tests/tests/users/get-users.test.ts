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

  it("should return error for non-existent user ID", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/users/nonexistent_id_999");
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 404]);
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
});
