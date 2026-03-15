import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Push compatibility endpoints", () => {
  it("POST /api/v1/register_client_device and POST /api/v1/remove_client_device should register and remove a client device", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const registerRes = await client.post("/register_client_device");
    expect(registerRes.status).to.equal(200);
    const deviceId = registerRes.body.device_id as string;
    expect(deviceId).to.be.a("string").and.not.equal("");

    const removeRes = await client.post("/remove_client_device", {
      device_id: deviceId,
    });
    expect(removeRes.status).to.equal(200);
  });

  it("POST /api/v1/remotes/push/e2ee/register should accept remote E2EE push device registration", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/remotes/push/e2ee/register", {
      realm_uuid: tenantId,
      token_id: "token-1",
      encrypted_push_registration: "encrypted-payload",
      bouncer_public_key: "public-key",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("POST /api/v1/mobile_push/register and POST /api/v1/mobile_push/test_notification should register a Zulip mobile push token and send a test notification", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client, userId } = await seedUser(db, tenantId);

    const registerRes = await client.post("/mobile_push/register", {
      token: "mobile-token-1",
      kind: "android_gcm",
    });
    expect(registerRes.status).to.equal(200);
    expect(registerRes.body.result).to.equal("success");

    const tokenRows = await db("push_device_token").where({
      tenant_id: tenantId,
      user_id: userId,
      token: "mobile-token-1",
      kind: "android_gcm",
    });
    expect(tokenRows).to.have.length(1);

    const testRes = await client.post("/mobile_push/test_notification");
    expect(testRes.status).to.equal(200);
    expect(testRes.body.result).to.equal("success");
    expect(testRes.body.devices_notified).to.equal(1);
  });

  it("POST /api/v1/mobile_push/e2ee/test_notification should accept the Zulip E2EE test notification endpoint", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/mobile_push/e2ee/test_notification");

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});
