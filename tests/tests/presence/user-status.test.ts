import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/users/me/status", () => {
  it("should set the user's status text and emoji", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/status", {
      status_text: "In a meeting",
      emoji_name: "calendar",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should clear the user's status when empty values are provided", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Set status first
    await client.post("/users/me/status", {
      status_text: "Busy",
      emoji_name: "working_on_it",
    });

    // Clear status
    const res = await client.post("/users/me/status", {
      status_text: "",
      emoji_name: "",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should allow setting only status_text without emoji", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/status", {
      status_text: "Working from home",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("GET /api/v1/users/:user_id/status", () => {
  it("should return the user's status", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);

    // Set status first
    await client.post("/users/me/status", {
      status_text: "In a meeting",
      emoji_name: "calendar",
    });

    const res = await client.get(`/users/${userId}/status`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("status");
  });

  it("should return empty status for user with no status set", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId);
    const user2 = await seedUser(db, tenantId);

    const res = await user1.client.get(`/users/${user2.userId}/status`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
