import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/presence", () => {
  it("should update the user's own presence status", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(res.body).to.have.property("presence_last_update_id");
    expect(res.body).to.have.property("server_timestamp");
    expect(res.body.presences).to.have.property(email);
    expect(res.body.presences[email]).to.have.property("website");
    expect(res.body.presences[email]).to.have.property("aggregated");
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

  it("should default the client to website and support ping_only without presences", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId);

    const pingRes = await client.post("/users/me/presence", {
      status: "idle",
      ping_only: true,
    });

    expect(pingRes.status).to.equal(200);
    expect(pingRes.body.result).to.equal("success");
    expect(pingRes.body).to.have.property("presence_last_update_id");
    expect(pingRes.body).to.not.have.property("presences");
    expect(pingRes.body).to.not.have.property("server_timestamp");

    const userPresenceRes = await client.get(`/users/${encodeURIComponent(email)}/presence`);
    expect(userPresenceRes.status).to.equal(200);
    expect(userPresenceRes.body.presence).to.have.property("website");
    expect(userPresenceRes.body.presence).to.have.property("aggregated");
  });

  it("should return modern presence data when last_update_id is provided", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    await user1.client.post("/users/me/presence", {
      status: "active",
    });
    await user2.client.post("/users/me/presence", {
      status: "idle",
    });

    const initialRes = await user1.client.post("/users/me/presence", {
      status: "active",
      last_update_id: -1,
    });

    expect(initialRes.status).to.equal(200);
    expect(initialRes.body.result).to.equal("success");
    expect(initialRes.body.presences).to.have.property(user1.userId);
    expect(initialRes.body.presences).to.have.property(user2.userId);
    expect(initialRes.body.presences[user1.userId]).to.have.property("active_timestamp");
    expect(initialRes.body).to.have.property("presence_last_update_id");

    const lastUpdateId = initialRes.body.presence_last_update_id as number;

    await user2.client.post("/users/me/presence", {
      status: "active",
    });

    const deltaRes = await user1.client.post("/users/me/presence", {
      status: "active",
      last_update_id: lastUpdateId,
    });

    expect(deltaRes.status).to.equal(200);
    expect(deltaRes.body.result).to.equal("success");
    expect(deltaRes.body.presences).to.have.property(user1.userId);
    expect(deltaRes.body.presences).to.have.property(user2.userId);
    expect(deltaRes.body.presences[user1.userId]).to.have.property("active_timestamp");
    expect(deltaRes.body.presences[user2.userId]).to.have.property("active_timestamp");
    expect((deltaRes.body.presence_last_update_id as number) >= lastUpdateId).to.equal(true);
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
    expect(res.body.presence).to.have.property("website");
    expect(res.body.presence).to.have.property("aggregated");
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
    expect(res.body.presence).to.have.property("website");
    expect(res.body.presence).to.have.property("aggregated");
  });
});

describe("GET /api/v1/realm/presence", () => {
  it("should return all presences in the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId);

    // Set presence so there's at least one entry
    await client.post("/users/me/presence", {
      status: "active",
      client: "website",
    });

    const res = await client.get("/realm/presence");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("presences");
    const presences = res.body.presences as Record<string, Record<string, unknown>>;
    const ownPresence = presences[email] ?? Object.values(presences)[0];
    expect(ownPresence).to.have.property("website");
    expect(ownPresence).to.have.property("aggregated");
    expect(ownPresence.website.client).to.equal("website");
    expect(ownPresence.website.pushable).to.equal(false);
  });
});
