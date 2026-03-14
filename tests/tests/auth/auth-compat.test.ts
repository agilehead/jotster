import { expect } from "chai";
import crypto from "node:crypto";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";
import { createApiClient } from "../../utils/api-client.js";

const createJwt = (payload: Record<string, unknown>, secret: string): string => {
  const encode = (value: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
};

const createTenantClient = async (tenantId: string, email: string, apiKey: string) => {
  const db = testDb.getDb();
  const row = await db("tenant").select("subdomain").where({ id: tenantId }).first();
  const subdomain = row?.subdomain as string;
  const baseUrl = process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";
  const port = new URL(baseUrl).port;
  const hostHeader = port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
  return createApiClient(baseUrl, email, apiKey, hostHeader);
};

describe("Auth compatibility endpoints", () => {
  it("should fetch an API key using JWT auth", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, email, userId } = await seedUser(db, tenantId);

    const token = createJwt(
      {
        email,
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "test-jwt-secret",
    );

    const res = await client.post("/jwt/fetch_api_key", {
      token,
      include_profile: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.email).to.equal(email);
    expect(res.body.user_id).to.equal(userId);
    expect(res.body.api_key).to.be.a("string").and.not.equal("");
    expect((res.body.user as Record<string, unknown>).email).to.equal(email);
  });

  it("should issue a development API key for a direct email login", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { email, userId } = await seedUser(db, tenantId);

    const tenantRow = await db("tenant").select("subdomain").where({ id: tenantId }).first();
    const subdomain = tenantRow?.subdomain as string;
    const baseUrl = process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";
    const port = new URL(baseUrl).port;
    const hostHeader = port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
    const anonymousClient = createApiClient(baseUrl, "", "", hostHeader);

    const res = await anonymousClient.post("/dev_fetch_api_key", {
        direct_email: email,
      });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.email).to.equal(email);
    expect(res.body.user_id).to.equal(userId);
    expect(res.body.api_key).to.be.a("string").and.not.equal("");
  });

  it("should regenerate the authenticated user's API key and invalidate the old key", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const seeded = await seedUser(db, tenantId);

    const res = await seeded.client.post("/users/me/api_key/regenerate");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.email).to.equal(seeded.email);
    expect(res.body.user_id).to.equal(seeded.userId);
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

  it("should list direct admins and users for dev_list_users", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId, { role: 400 });
    const bot = await seedUser(db, tenantId, {
      email: `bot-${Date.now()}@test.local`,
      isBot: 1,
      botType: 1,
      botOwnerId: admin.userId,
    });

    const res = await admin.client.get("/dev_list_users");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    const directAdmins = res.body.direct_admins as Array<Record<string, unknown>>;
    const directUsers = res.body.direct_users as Array<Record<string, unknown>>;
    expect(directAdmins.some((entry) => entry.email === admin.email && typeof entry.realm_url === "string")).to.equal(true);
    expect((res.body.direct_users as Array<Record<string, unknown>>).some((entry) => entry.email === member.email)).to.equal(true);
    expect(directAdmins.some((entry) => entry.email === bot.email)).to.equal(false);
    expect(directUsers.some((entry) => entry.email === bot.email)).to.equal(false);
  });
});
