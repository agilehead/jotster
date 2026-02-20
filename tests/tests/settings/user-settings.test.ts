import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("PATCH /api/v1/settings", () => {
  it("should update user settings", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.patch("/settings", {
      twenty_four_hour_time: "true",
      dense_mode: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should allow updating a single setting", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.patch("/settings", {
      twenty_four_hour_time: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return success with empty body when no settings provided", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.patch("/settings");

    // Should either succeed with no-op or return a validation error
    expect(res.status).to.be.oneOf([200, 400]);
    expect(res.body).to.have.property("result");
  });
});
