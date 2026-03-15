import { expect } from "chai";
import crypto from "node:crypto";
import { testDb } from "../../test-setup.js";
import { createApiClient } from "../../utils/api-client.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

const getBaseUrl = (): string => process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";

const getTenantHostHeader = async (tenantId: number): Promise<string> => {
  const db = testDb.getDb();
  const row = await db("tenant").select("subdomain").where({ id: tenantId }).first();
  const subdomain = row?.subdomain as string;
  const port = new URL(getBaseUrl()).port;
  return port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
};

const createAnonymousTenantClient = async (tenantId: number) => {
  return createApiClient(getBaseUrl(), "", "", await getTenantHostHeader(tenantId));
};

const setPassword = async (userId: number, password: string): Promise<void> => {
  const salt = "testsalt";
  const digest = crypto.createHash("sha256").update(`${salt}:${password}`, "utf8").digest("hex");
  await testDb.getDb()("user").where({ id: userId }).update({ password_hash: `${salt}:${digest}` });
};

describe("POST /api/v1/fetch_api_key", () => {
  it("should return the existing API key for valid credentials", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    const password = "correct-horse-battery-staple";
    await setPassword(seeded.userId, password);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: seeded.email,
      password,
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(Object.keys(res.body).sort()).to.deep.equal([
      "api_key",
      "email",
      "msg",
      "result",
      "user_id",
    ]);
    expect(res.body.api_key).to.equal(seeded.apiKey);
    expect(res.body.email).to.equal(seeded.email);
    expect(res.body.user_id).to.equal(seeded.userId);

    const me = await seeded.client.get("/users/me");
    expect(me.status).to.equal(200);
  });

  it("should reject invalid email format", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    await seedUser(db, tenantId);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: "hamlet",
      password: "irrelevant",
    });

    expect(res.status).to.equal(400);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Enter a valid email address.");
  });

  it("should reject wrong password with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await setPassword(seeded.userId, "correct-password");

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: seeded.email,
      password: "wrong-password",
    });

    expect(res.status).to.equal(401);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });

  it("should reject unknown users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    await seedUser(db, tenantId);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: "nonexistent@test.local",
      password: "some-password",
    });

    expect(res.status).to.equal(401);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });

  it("should reject inactive users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await setPassword(seeded.userId, "correct-password");
    await db("user").where({ id: seeded.userId }).update({ is_active: 0 });

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: seeded.email,
      password: "correct-password",
    });

    expect(res.status).to.equal(401);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Account is deactivated");
  });

  it("should reject deactivated realms with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await setPassword(seeded.userId, "correct-password");
    await db("tenant").where({ id: tenantId }).update({ active: 0 });

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/fetch_api_key", {
      username: seeded.email,
      password: "correct-password",
    });

    expect(res.status).to.equal(401);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("This organization has been deactivated");
  });

  it("should reject invalid subdomains with 404", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    await seedUser(db, tenantId);

    const port = new URL(getBaseUrl()).port;
    const hostHeader = port === "" ? "missing.test.local" : `missing.test.local:${port}`;
    const client = createApiClient(getBaseUrl(), "", "", hostHeader);
    const res = await client.post("/fetch_api_key", {
      username: "missing@test.local",
      password: "irrelevant",
    });

    expect(res.status).to.equal(404);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Invalid subdomain");
  });

  it("should reject users logging into the wrong tenant with 401", async () => {
    const db = testDb.getDb();
    const tenantA = await seedTenant(db);
    const tenantB = await seedTenant(db);
    const seeded = await seedUser(db, tenantB);
    await setPassword(seeded.userId, "correct-password");

    const client = await createAnonymousTenantClient(tenantA);
    const res = await client.post("/fetch_api_key", {
      username: seeded.email,
      password: "correct-password",
    });

    expect(res.status).to.equal(401);
    expect(res.body.result).to.equal("error");
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });
});
