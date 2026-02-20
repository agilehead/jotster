import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/users/me/alert_words", () => {
  it("should return the user's alert words", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/users/me/alert_words");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("alert_words");
    expect(res.body.alert_words).to.be.an("array");
  });

  it("should return empty alert words for new user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/users/me/alert_words");
    expect(res.status).to.equal(200);
    expect(res.body.alert_words).to.be.an("array").with.length(0);
  });
});

describe("POST /api/v1/users/me/alert_words", () => {
  it("should add alert words", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug", "urgent"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("alert_words");
    expect(res.body.alert_words).to.be.an("array");
    expect(res.body.alert_words).to.include("bug");
    expect(res.body.alert_words).to.include("urgent");
  });

  it("should handle adding duplicate alert words gracefully", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Add words
    await client.post("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug"]),
    });

    // Add same word again
    const res = await client.post("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("DELETE /api/v1/users/me/alert_words", () => {
  it("should remove specific alert words", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Add words first
    await client.post("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug", "urgent", "critical"]),
    });

    // Remove one word
    const res = await client.delete("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("alert_words");
    expect(res.body.alert_words).to.not.include("bug");
    expect(res.body.alert_words).to.include("urgent");
    expect(res.body.alert_words).to.include("critical");
  });

  it("should handle removing non-existent alert words gracefully", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/users/me/alert_words", {
      alert_words: JSON.stringify(["nonexistent"]),
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
