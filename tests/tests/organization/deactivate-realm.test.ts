import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/realm/deactivate", () => {
  it("should allow owner to deactivate the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 100 }); // owner

    const res = await client.post("/realm/deactivate");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should reject non-owner from deactivating the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 }); // admin, not owner

    const res = await client.post("/realm/deactivate");

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });

  it("should reject regular member from deactivating the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 400 }); // member

    const res = await client.post("/realm/deactivate");

    expect(res.body.result).to.equal("error");
    expect(res.status).to.be.oneOf([400, 403]);
  });
});
