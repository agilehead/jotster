import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("PATCH /api/v1/users/{user_id}", () => {
  it("should allow admin to update another user's full name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: adminClient } = await seedUser(db, tenantId, { role: 200 });
    const { userId: targetUserId } = await seedUser(db, tenantId, { fullName: "Old Name" });

    const res = await adminClient.patch(`/users/${targetUserId}`, {
      full_name: "New Name",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should allow admin to update another user's role", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: adminClient } = await seedUser(db, tenantId, { role: 200 });
    const { userId: targetUserId } = await seedUser(db, tenantId, { role: 400 });

    const res = await adminClient.patch(`/users/${targetUserId}`, {
      role: "300", // promote to moderator
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow a regular member to update another user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: memberClient } = await seedUser(db, tenantId, { role: 400 });
    const { userId: targetUserId } = await seedUser(db, tenantId, { fullName: "Other User" });

    const res = await memberClient.patch(`/users/${targetUserId}`, {
      full_name: "Hacked Name",
    });

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should return error for non-existent user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.patch("/users/nonexistent_id_999", {
      full_name: "Ghost",
    });

    expect(res.body.result).to.equal("error");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});
