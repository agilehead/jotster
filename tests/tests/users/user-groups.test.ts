import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

const getGroupIdByName = async (client: Awaited<ReturnType<typeof seedUser>>["client"], name: string): Promise<string> => {
  const listRes = await client.get("/user_groups");
  const groups = listRes.body.user_groups as Array<{
    id: string;
    name: string;
  }>;
  const group = groups.find((entry) => entry.name === name);
  expect(group).to.not.be.undefined;
  return group!.id;
};

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

describe("User group compatibility endpoints", () => {
  it("should report recursive and direct membership status", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const directMember = await seedUser(db, tenantId);
    const nestedMember = await seedUser(db, tenantId);

    await admin.client.post("/user_groups/create", {
      name: "parent-group",
      description: "Parent group",
      members: JSON.stringify([admin.userId, directMember.userId]),
    });
    await admin.client.post("/user_groups/create", {
      name: "child-group",
      description: "Child group",
      members: JSON.stringify([nestedMember.userId]),
    });

    const parentGroupId = await getGroupIdByName(admin.client, "parent-group");
    const childGroupId = await getGroupIdByName(admin.client, "child-group");

    const mutateRes = await admin.client.post(`/user_groups/${parentGroupId}/members`, {
      add_subgroups: JSON.stringify([childGroupId]),
    });
    expect(mutateRes.status).to.equal(200);

    const recursiveRes = await admin.client.get(`/user_groups/${parentGroupId}/members/${nestedMember.userId}`);
    expect(recursiveRes.status).to.equal(200);
    expect(recursiveRes.body.is_user_group_member).to.equal(true);

    const directOnlyRes = await admin.client.get(
      `/user_groups/${parentGroupId}/members/${nestedMember.userId}`,
      { direct_member_only: "true" },
    );
    expect(directOnlyRes.status).to.equal(200);
    expect(directOnlyRes.body.is_user_group_member).to.equal(false);
  });

  it("should return direct-only and recursive user group members", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const directMember = await seedUser(db, tenantId);
    const nestedMember = await seedUser(db, tenantId);

    await admin.client.post("/user_groups/create", {
      name: "members-parent",
      description: "Parent group",
      members: JSON.stringify([admin.userId, directMember.userId]),
    });
    await admin.client.post("/user_groups/create", {
      name: "members-child",
      description: "Child group",
      members: JSON.stringify([nestedMember.userId]),
    });

    const parentGroupId = await getGroupIdByName(admin.client, "members-parent");
    const childGroupId = await getGroupIdByName(admin.client, "members-child");

    await admin.client.post(`/user_groups/${parentGroupId}/members`, {
      add_subgroups: JSON.stringify([childGroupId]),
    });

    const recursiveRes = await admin.client.get(`/user_groups/${parentGroupId}/members`);
    expect(recursiveRes.status).to.equal(200);
    expect(recursiveRes.body.members).to.have.members([admin.userId, directMember.userId, nestedMember.userId]);

    const directOnlyRes = await admin.client.get(`/user_groups/${parentGroupId}/members`, {
      direct_member_only: "true",
    });
    expect(directOnlyRes.status).to.equal(200);
    expect(directOnlyRes.body.members).to.have.members([admin.userId, directMember.userId]);
  });

  it("should return direct-only and recursive subgroup lists", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });

    await admin.client.post("/user_groups/create", { name: "root-group", description: "Root" });
    await admin.client.post("/user_groups/create", { name: "middle-group", description: "Middle" });
    await admin.client.post("/user_groups/create", { name: "leaf-group", description: "Leaf" });

    const rootGroupId = await getGroupIdByName(admin.client, "root-group");
    const middleGroupId = await getGroupIdByName(admin.client, "middle-group");
    const leafGroupId = await getGroupIdByName(admin.client, "leaf-group");

    await admin.client.post(`/user_groups/${rootGroupId}/members`, {
      add_subgroups: JSON.stringify([middleGroupId]),
    });
    await admin.client.post(`/user_groups/${middleGroupId}/subgroups`, {
      add: JSON.stringify([leafGroupId]),
    });

    const recursiveRes = await admin.client.get(`/user_groups/${rootGroupId}/subgroups`);
    expect(recursiveRes.status).to.equal(200);
    expect(recursiveRes.body.subgroups).to.have.members([middleGroupId, leafGroupId]);

    const directOnlyRes = await admin.client.get(`/user_groups/${rootGroupId}/subgroups`, {
      direct_subgroup_only: "true",
    });
    expect(directOnlyRes.status).to.equal(200);
    expect(directOnlyRes.body.subgroups).to.have.members([middleGroupId]);
  });

  it("should allow removing subgroups via the members compatibility endpoint", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const nestedMember = await seedUser(db, tenantId);

    await admin.client.post("/user_groups/create", {
      name: "remove-parent",
      description: "Parent group",
      members: JSON.stringify([admin.userId]),
    });
    await admin.client.post("/user_groups/create", {
      name: "remove-child",
      description: "Child group",
      members: JSON.stringify([nestedMember.userId]),
    });

    const parentGroupId = await getGroupIdByName(admin.client, "remove-parent");
    const childGroupId = await getGroupIdByName(admin.client, "remove-child");

    await admin.client.post(`/user_groups/${parentGroupId}/members`, {
      add_subgroups: JSON.stringify([childGroupId]),
    });

    const beforeDelete = await admin.client.get(`/user_groups/${parentGroupId}/members/${nestedMember.userId}`);
    expect(beforeDelete.body.is_user_group_member).to.equal(true);

    const deleteRes = await admin.client.post(`/user_groups/${parentGroupId}/members`, {
      delete_subgroups: JSON.stringify([childGroupId]),
    });
    expect(deleteRes.status).to.equal(200);

    const afterDelete = await admin.client.get(`/user_groups/${parentGroupId}/members/${nestedMember.userId}`);
    expect(afterDelete.body.is_user_group_member).to.equal(false);
  });
});
