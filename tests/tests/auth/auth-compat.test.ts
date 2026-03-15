import { expect } from "chai";
import crypto from "node:crypto";
import { testDb } from "../../test-setup.js";
import { createApiClient } from "../../utils/api-client.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";
import { TestServer } from "../../utils/test-server.js";

const createJwt = (payload: Record<string, unknown>, secret: string): string => {
  const encode = (value: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
};

const getBaseUrl = (): string => process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";

const getTenantHostHeader = async (tenantId: string, baseUrl = getBaseUrl()): Promise<string> => {
  const row = await testDb.getDb()("tenant").select("subdomain").where({ id: tenantId }).first();
  const subdomain = row?.subdomain as string;
  const port = new URL(baseUrl).port;
  return port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
};

const createTenantClient = async (tenantId: string, email: string, apiKey: string, baseUrl = getBaseUrl()) => {
  return createApiClient(baseUrl, email, apiKey, await getTenantHostHeader(tenantId, baseUrl));
};

const createAnonymousTenantClient = async (tenantId: string, baseUrl = getBaseUrl()) => {
  return createApiClient(baseUrl, "", "", await getTenantHostHeader(tenantId, baseUrl));
};

const withTemporaryServer = async (
  envOverrides: Record<string, string>,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> => {
  const server = new TestServer({ envOverrides });
  await server.start();
  try {
    await run(server.getBaseUrl());
  } finally {
    await server.stop();
  }
};

describe("Auth compatibility endpoints", () => {
  it("POST /api/v1/jwt/fetch_api_key should return the existing API key and optional profile", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const token = createJwt(
      {
        email: seeded.email,
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "test-jwt-secret",
    );

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", {
      token,
      include_profile: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.email).to.equal(seeded.email);
    expect(res.body.api_key).to.equal(seeded.apiKey);
    expect(res.body).to.not.have.property("user_id");
    expect((res.body.user as Record<string, unknown>).email).to.equal(seeded.email);
    expect((res.body.user as Record<string, unknown>).is_imported_stub).to.equal(false);
  });

  it("POST /api/v1/jwt/fetch_api_key should omit profile by default", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const token = createJwt({ email: seeded.email }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.api_key).to.equal(seeded.apiKey);
    expect(res.body).to.not.have.property("user");
    expect(res.body).to.not.have.property("user_id");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject invalid subdomains with 404", async () => {
    const db = testDb.getDb();
    await seedTenant(db);
    const port = new URL(getBaseUrl()).port;
    const hostHeader = port === "" ? "missing.test.local" : `missing.test.local:${port}`;
    const client = createApiClient(getBaseUrl(), "", "", hostHeader);
    const res = await client.post("/jwt/fetch_api_key");

    expect(res.status).to.equal(404);
    expect(res.body.msg).to.equal("Invalid subdomain");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject disabled JWT auth", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    await withTemporaryServer({ JOTSTER_JWT_SECRET: "" }, async (baseUrl) => {
      const client = await createAnonymousTenantClient(tenantId, baseUrl);
      const res = await client.post("/jwt/fetch_api_key");

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal("JWT authentication is not enabled for this organization");
    });
  });

  it("POST /api/v1/jwt/fetch_api_key should reject missing JWT payloads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key");

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("No JSON web token passed in request");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject bad JWT signatures", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const token = createJwt({ email: seeded.email }, "wrong-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("Bad JSON web token");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject malformed JWTs", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token: "bad_jwt_token" });

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("Bad JSON web token");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject JWTs missing the email claim", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const token = createJwt({ foo: "bar" }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("No email specified in JSON web token claims");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject empty JWT email claims with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const token = createJwt({ email: "" }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject unknown users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const token = createJwt({ email: "missing@test.local" }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject inactive users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await db("user").where({ id: seeded.userId }).update({ is_active: 0 });

    const token = createJwt({ email: seeded.email }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("Account is deactivated");
  });

  it("POST /api/v1/jwt/fetch_api_key should reject deactivated realms with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await db("tenant").where({ id: tenantId }).update({ active: 0 });

    const token = createJwt({ email: seeded.email }, "test-jwt-secret");
    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/jwt/fetch_api_key", { token });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("This organization has been deactivated");
  });

  it("POST /api/v1/dev_fetch_api_key should return the existing API key for a direct email login", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/dev_fetch_api_key", {
      direct_email: seeded.email,
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
    expect(res.body.email).to.equal(seeded.email);
    expect(res.body.user_id).to.equal(seeded.userId);
    expect(res.body.api_key).to.equal(seeded.apiKey);
  });

  it("POST /api/v1/dev_fetch_api_key should reject invalid email format", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/dev_fetch_api_key", {
      username: "hamlet",
    });

    expect(res.status).to.equal(400);
    expect(res.body.msg).to.equal("Enter a valid email address.");
  });

  it("POST /api/v1/dev_fetch_api_key should reject unknown users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/dev_fetch_api_key", {
      username: "missing@test.local",
    });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("Your username or password is incorrect");
  });

  it("POST /api/v1/dev_fetch_api_key should reject inactive users with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await db("user").where({ id: seeded.userId }).update({ is_active: 0 });

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/dev_fetch_api_key", {
      username: seeded.email,
    });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("Account is deactivated");
  });

  it("POST /api/v1/dev_fetch_api_key should reject deactivated realms with 401", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);
    await db("tenant").where({ id: tenantId }).update({ active: 0 });

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.post("/dev_fetch_api_key", {
      username: seeded.email,
    });

    expect(res.status).to.equal(401);
    expect(res.body.msg).to.equal("This organization has been deactivated");
  });

  it("POST /api/v1/dev_fetch_api_key should reject invalid subdomains with 404", async () => {
    const db = testDb.getDb();
    await seedTenant(db);
    const port = new URL(getBaseUrl()).port;
    const hostHeader = port === "" ? "missing.test.local" : `missing.test.local:${port}`;
    const client = createApiClient(getBaseUrl(), "", "", hostHeader);
    const res = await client.post("/dev_fetch_api_key", { username: "missing@test.local" });

    expect(res.status).to.equal(404);
    expect(res.body.msg).to.equal("Invalid subdomain");
  });

  it("POST /api/v1/dev_fetch_api_key should reject when dev auth is disabled", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    await withTemporaryServer({ JOTSTER_DEV_AUTH_ENABLED: "0" }, async (baseUrl) => {
      const client = await createAnonymousTenantClient(tenantId, baseUrl);
      const res = await client.post("/dev_fetch_api_key", { username: seeded.email });

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal("DevAuthBackend not enabled.");
    });
  });

  it("POST /api/v1/users/me/api_key/regenerate should regenerate the authenticated user's API key and invalidate the old key", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const res = await seeded.client.post("/users/me/api_key/regenerate");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.not.have.property("email");
    expect(res.body).to.not.have.property("user_id");
    const regeneratedKey = res.body.api_key as string;
    expect(regeneratedKey).to.be.a("string").and.not.equal("");
    expect(regeneratedKey).to.not.equal(seeded.apiKey);

    const oldKeyRes = await seeded.client.get("/users/me");
    expect(oldKeyRes.status).to.equal(401);

    const freshClient = await createTenantClient(tenantId, seeded.email, regeneratedKey);
    const newKeyRes = await freshClient.get("/users/me");
    expect(newKeyRes.status).to.equal(200);
    expect(newKeyRes.body.user_id).to.equal(seeded.userId);
    expect(newKeyRes.body.email).to.equal(seeded.email);
  });

  it("GET /api/v1/dev_list_users should list active non-bot users across tenants with realm URLs", async () => {
    const db = testDb.getDb();
    const tenantA = await seedTenant(db, { subdomain: "alpha" });
    const tenantB = await seedTenant(db, { subdomain: "beta" });
    const owner = await seedUser(db, tenantA, { role: 100 });
    const secondOwner = await seedUser(db, tenantA, { role: 200, email: "zeta-admin@test.local" });
    const member = await seedUser(db, tenantB, { role: 400 });
    const secondMember = await seedUser(db, tenantB, { email: "alpha-member@test.local" });
    const bot = await seedUser(db, tenantB, {
      email: `bot-${Date.now()}@test.local`,
      isBot: 1,
      botType: 1,
      botOwnerId: owner.userId,
    });
    const inactive = await seedUser(db, tenantB, { email: "inactive@test.local" });
    await db("user").where({ id: inactive.userId }).update({ is_active: 0 });

    const client = await createAnonymousTenantClient(tenantA);
    const res = await client.get("/dev_list_users");
    const port = new URL(getBaseUrl()).port;
    const alphaRealmUrl = port === "" ? "http://alpha.test.local" : `http://alpha.test.local:${port}`;
    const betaRealmUrl = port === "" ? "http://beta.test.local" : `http://beta.test.local:${port}`;

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.msg).to.equal("");
    expect(Object.keys(res.body).sort()).to.deep.equal([
      "direct_admins",
      "direct_users",
      "msg",
      "result",
    ]);
    const directAdmins = res.body.direct_admins as Array<Record<string, unknown>>;
    const directUsers = res.body.direct_users as Array<Record<string, unknown>>;
    expect(directAdmins).to.deep.equal([
      { email: owner.email, realm_url: alphaRealmUrl },
      { email: secondOwner.email, realm_url: alphaRealmUrl },
    ]);
    expect(directUsers).to.deep.equal([
      { email: secondMember.email, realm_url: betaRealmUrl },
      { email: member.email, realm_url: betaRealmUrl },
    ]);
    expect(directAdmins.some((entry) => entry.email === bot.email)).to.equal(false);
    expect(directUsers.some((entry) => entry.email === bot.email)).to.equal(false);
    expect(directAdmins.some((entry) => entry.email === inactive.email)).to.equal(false);
    expect(directUsers.some((entry) => entry.email === inactive.email)).to.equal(false);
  });

  it("GET /api/v1/dev_list_users should reject when dev auth is disabled", async () => {
    await withTemporaryServer({ JOTSTER_DEV_AUTH_ENABLED: "0" }, async (baseUrl) => {
      const client = createApiClient(baseUrl, "", "", undefined);
      const res = await client.get("/dev_list_users");

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal("DevAuthBackend not enabled.");
    });
  });

  it("GET /api/v1/dev_list_users should reject in production mode", async () => {
    await withTemporaryServer({ JOTSTER_PRODUCTION: "1" }, async (baseUrl) => {
      const client = createApiClient(baseUrl, "", "", undefined);
      const res = await client.get("/dev_list_users");

      expect(res.status).to.equal(400);
      expect(res.body.msg).to.equal("Endpoint not available in production.");
    });
  });
});
