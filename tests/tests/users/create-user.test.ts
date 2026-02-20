import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/users", () => {
  it("should allow admin to create a new user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

    const res = await client.post("/users", {
      email: "newuser@test.local",
      password: "securepassword123",
      full_name: "New User",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("user_id");
  });

  it("should reject user creation by non-admin (member)", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 }); // member

    const res = await client.post("/users", {
      email: "another@test.local",
      password: "securepassword123",
      full_name: "Another User",
    });

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should reject creation with missing required fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/users", {
      email: "incomplete@test.local",
      // missing password and full_name
    });

    expect(res.body.result).to.equal("error");
  });

  it("should reject duplicate email", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/users", {
      email, // same email as the admin
      password: "securepassword123",
      full_name: "Duplicate User",
    });

    expect(res.body.result).to.equal("error");
  });
});
