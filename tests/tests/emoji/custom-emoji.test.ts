import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/realm/emoji", () => {
  it("should return all custom emoji for the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/realm/emoji");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("emoji");
  });

  it("should return an empty emoji object when no custom emoji exist", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/realm/emoji");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.emoji).to.deep.equal({});
  });

  // Note: POST /api/v1/realm/emoji/:emoji_name and DELETE /api/v1/realm/emoji/:emoji_name
  // require multipart file upload which our ApiClient doesn't support.
  // These endpoints are tested manually or via a dedicated upload test harness.
});
