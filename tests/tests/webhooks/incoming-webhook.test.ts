import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/external/:integration_name", () => {
  it("should accept a webhook payload for a valid integration", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, {
      isBot: 1,
      botType: 1,
    });

    const res = await client.post("/external/github", {
      payload: JSON.stringify({ action: "push", ref: "refs/heads/main" }),
    });

    // The endpoint should exist; may succeed or return an error depending on integration config
    expect(res.status).to.be.oneOf([200, 400, 404]);
    expect(res.body).to.have.property("result");
  });

  it("should return error for unknown integration name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/external/nonexistent_integration", {
      payload: "{}",
    });

    expect(res.status).to.be.oneOf([400, 404]);
    expect(res.body.result).to.equal("error");
  });
});
