import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Webhook and docs compatibility endpoints", () => {
  it("should respond to docs example endpoints", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const realTimeRes = await client.post("/real-time");
    expect(realTimeRes.status).to.equal(200);
    expect(realTimeRes.body.result).to.equal("success");

    const restErrorRes = await client.post("/rest-error-handling");
    expect(restErrorRes.status).to.equal(400);
    expect(restErrorRes.body.code).to.equal("BAD_REQUEST");
  });

  it("should accept Zulip outgoing webhook requests", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/zulip-outgoing-webhook", {
      data: JSON.stringify({ command: "ping" }),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
