import { expect } from "chai";
import { testDb, testServer } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("POST /api/v1/fetch_api_key", () => {
  it("should return error for invalid credentials", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email } = await seedUser(db, tenantId);

    const res = await client.post("/fetch_api_key", {
      username: email,
      password: "wrong-password",
    });

    // The endpoint should exist and return an error for bad credentials
    expect(res.body.result).to.equal("error");
    expect(res.body).to.have.property("msg");
  });

  it("should return error when username is missing", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/fetch_api_key", {
      password: "some-password",
    });

    expect(res.body.result).to.equal("error");
  });

  it("should return error for non-existent user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/fetch_api_key", {
      username: "nonexistent@test.local",
      password: "any-password",
    });

    expect(res.body.result).to.equal("error");
  });
});
