import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { createApiClient } from "../../utils/api-client.js";
import { seedTenant } from "../../utils/test-helpers.js";
import { TestServer } from "../../utils/test-server.js";

const getBaseUrl = (): string => process.env.JOTSTER_TEST_BASE_URL ?? "http://localhost:9877";

const getTenantHostHeader = async (tenantId: string, baseUrl = getBaseUrl()): Promise<string> => {
  const row = await testDb.getDb()("tenant").select("subdomain").where({ id: tenantId }).first();
  const subdomain = row?.subdomain as string;
  const port = new URL(baseUrl).port;
  return port === "" ? `${subdomain}.test.local` : `${subdomain}.test.local:${port}`;
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

describe("GET /api/v1/server_settings", () => {
  it("should return a Zulip-compatible unauthenticated server settings payload", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, {
      subdomain: "settings",
      name: "Settings Org",
      description: "Settings description",
      iconUrl: "https://cdn.test.local/icon.png",
    });

    const client = await createAnonymousTenantClient(tenantId);
    const res = await client.get("/server_settings");
    const expectedRealmUrl = new URL(`http://${await getTenantHostHeader(tenantId)}`).toString().replace(/\/$/, "");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.include({
      result: "success",
      msg: "",
      push_notifications_enabled: false,
      is_incompatible: false,
      email_auth_enabled: true,
      require_email_format_usernames: true,
      realm_name: "Settings Org",
      realm_description: "<p>Settings description</p>",
      realm_icon: "https://cdn.test.local/icon.png",
      realm_uri: expectedRealmUrl,
      realm_url: expectedRealmUrl,
      realm_web_public_access_enabled: false,
    });
    expect(res.body).to.have.property("zulip_version").that.is.a("string");
    expect(res.body).to.have.property("zulip_feature_level").that.is.a("number");
    expect(res.body).to.have.property("zulip_merge_base").that.is.a("string");
    expect(res.body.authentication_methods).to.deep.equal({
      password: true,
      dev: true,
      email: true,
      ldap: false,
      remoteuser: false,
      github: false,
      azuread: false,
      gitlab: false,
      apple: false,
      google: false,
      saml: false,
      "openid connect": false,
    });
    expect(res.body.external_authentication_methods).to.deep.equal([]);
  });

  it("should reflect disabled dev auth and default the realm icon", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, {
      subdomain: "settings-dev-off",
      name: "Settings Dev Off",
      description: "No dev auth",
    });

    await withTemporaryServer({ JOTSTER_DEV_AUTH_ENABLED: "0" }, async (baseUrl) => {
      const client = await createAnonymousTenantClient(tenantId, baseUrl);
      const res = await client.get("/server_settings");
      const expectedRealmUrl = new URL(`http://${await getTenantHostHeader(tenantId, baseUrl)}`).toString().replace(/\/$/, "");

      expect(res.status).to.equal(200);
      expect(res.body.authentication_methods.dev).to.equal(false);
      expect(res.body.realm_icon).to.equal("/static/images/logo/zulip-icon-circle.png");
      expect(res.body.realm_uri).to.equal(expectedRealmUrl);
      expect(res.body.realm_url).to.equal(expectedRealmUrl);
    });
  });
});
