import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/user_groups", () => {
  it("should return all user groups", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/user_groups");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("user_groups");
    expect(res.body.user_groups).to.be.an("array");
  });
});

describe("POST /api/v1/user_groups/create", () => {
  it("should create a new user group", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/user_groups/create", {
      name: "engineers",
      description: "Engineering team",
      members: JSON.stringify([userId]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
  });

  it("should reject creating a group without a name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/user_groups/create", {
      description: "No name group",
      members: JSON.stringify([userId]),
    });

    expect(res.body.result).to.equal("error");
  });

  it("should create a group with multiple members", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user1 = await seedUser(db, tenantId, { role: 200 });
    const user2 = await seedUser(db, tenantId);

    const res = await user1.client.post("/user_groups/create", {
      name: "design-team",
      description: "Design department",
      members: JSON.stringify([user1.userId, user2.userId]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("PATCH /api/v1/user_groups/:group_id", () => {
  it("should update a user group name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId, { role: 200 });

    // Create group first
    const createRes = await client.post("/user_groups/create", {
      name: "old-name",
      description: "A group",
      members: JSON.stringify([userId]),
    });

    // Get the group ID from the list
    const listRes = await client.get("/user_groups");
    const groups = listRes.body.user_groups as Array<{
      id: string;
      name: string;
    }>;
    const group = groups.find((g) => g.name === "old-name");
    expect(group).to.not.be.undefined;

    // Update it
    const res = await client.patch(`/user_groups/${group!.id}`, {
      name: "new-name",
      description: "Updated description",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("POST /api/v1/user_groups/:group_id/deactivate", () => {
  it("should deactivate a user group", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId, { role: 200 });

    // Create group first
    await client.post("/user_groups/create", {
      name: "temp-group",
      description: "Temporary group",
      members: JSON.stringify([userId]),
    });

    // Get the group ID from the list
    const listRes = await client.get("/user_groups");
    const groups = listRes.body.user_groups as Array<{
      id: string;
      name: string;
    }>;
    const group = groups.find((g) => g.name === "temp-group");
    expect(group).to.not.be.undefined;

    // Deactivate it
    const res = await client.post(`/user_groups/${group!.id}/deactivate`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
