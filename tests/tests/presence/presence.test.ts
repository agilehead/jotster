import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/presence", () => {
  it("should update the user's own presence status", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should reject invalid status values", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/presence", {
      status: "invalid_status",
      client: "website",
    });

    expect(res.body.result).to.equal("error");
  });

  it("should require status parameter", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/presence", {
      client: "website",
    });

    expect(res.body.result).to.equal("error");
  });
});

describe("GET /api/v1/users/{user_id_or_email}/presence", () => {
  it("should return presence info for a user by email", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId);

    // Set presence first
    await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    const res = await client.get(`/users/${encodeURIComponent(email)}/presence`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("presence");
  });

  it("should return presence info for a user by user id", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);

    // Set presence first
    await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    const res = await client.get(`/users/${userId}/presence`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("presence");
  });
});

describe("GET /api/v1/realm/presence", () => {
  it("should return all presences in the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Set presence so there's at least one entry
    await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    const res = await client.get("/realm/presence");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("presences");
  });
});
