import { expect } from "chai";
import { testDb, testServer } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/server_settings", () => {
  it("should return server settings with zulip version info", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/server_settings");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("zulip_version");
    expect(res.body).to.have.property("zulip_feature_level");
  });

  it("should include authentication methods", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/server_settings");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("authentication_methods");
  });

  it("should return msg as empty string on success", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/server_settings");
    expect(res.status).to.equal(200);
    expect(res.body.msg).to.equal("");
  });
});
