import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("DELETE /api/v1/users/{user_id}", () => {
  it("should allow admin to deactivate a user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: adminClient } = await seedUser(db, tenantId, { role: 200 });
    const { userId: targetUserId } = await seedUser(db, tenantId, { fullName: "To Deactivate" });

    const res = await adminClient.delete(`/users/${targetUserId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow a regular member to deactivate another user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: memberClient } = await seedUser(db, tenantId, { role: 400 });
    const { userId: targetUserId } = await seedUser(db, tenantId);

    const res = await memberClient.delete(`/users/${targetUserId}`);
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should return error for non-existent user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.delete("/users/999999");
    expect(res.body.result).to.equal("error");
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});

describe("DELETE /api/v1/users/me", () => {
  it("should allow a user to deactivate themselves", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/users/me");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("POST /api/v1/users/{user_id}/reactivate", () => {
  it("should allow admin to reactivate a deactivated user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: adminClient } = await seedUser(db, tenantId, { role: 200 });
    const { userId: targetUserId } = await seedUser(db, tenantId);

    // First deactivate
    const deactivateRes = await adminClient.delete(`/users/${targetUserId}`);
    expect(deactivateRes.status).to.equal(200);

    // Then reactivate
    const res = await adminClient.post(`/users/${targetUserId}/reactivate`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should not allow a regular member to reactivate a user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client: adminClient } = await seedUser(db, tenantId, { role: 200 });
    const { client: memberClient } = await seedUser(db, tenantId, { role: 400 });
    const { userId: targetUserId } = await seedUser(db, tenantId);

    // Admin deactivates
    await adminClient.delete(`/users/${targetUserId}`);

    // Member tries to reactivate
    const res = await memberClient.post(`/users/${targetUserId}/reactivate`);
    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
    expect(res.body.code).to.equal("BAD_REQUEST");
  });
});
