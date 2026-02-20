import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("PATCH /api/v1/realm", () => {
  it("should allow admin to update organization settings", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

    const res = await client.patch("/realm", {
      name: "New Org Name",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should reject non-admin from updating organization settings", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 }); // member

    const res = await client.patch("/realm", {
      name: "Hacked Org Name",
    });

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });
});

describe("PATCH /api/v1/realm/user_settings_defaults", () => {
  it("should allow admin to update user setting defaults", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

    const res = await client.patch("/realm/user_settings_defaults", {
      twenty_four_hour_time: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
