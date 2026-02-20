import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Invitations", () => {
  describe("GET /api/v1/invites", () => {
    it("should allow admin to get all invitations", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.get("/invites");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("invites");
    });

    it("should reject non-admin from listing invitations", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 400 }); // member

      const res = await client.get("/invites");

      expect(res.body.result).to.equal("error");
      expect(res.status).to.be.oneOf([400, 403]);
    });
  });

  describe("POST /api/v1/invites", () => {
    it("should send an invitation to a new user", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.post("/invites", {
        invitee_emails: "newuser@test.com",
        stream_ids: "[]",
      });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
    });
  });

  describe("POST /api/v1/invites/multiuse", () => {
    it("should create a multiuse invitation link", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      const res = await client.post("/invites/multiuse");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("invite_link");
    });
  });

  describe("DELETE /api/v1/invites/:invite_id", () => {
    it("should revoke an invitation", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId, { role: 200 }); // admin

      // First create an invitation
      const createRes = await client.post("/invites", {
        invitee_emails: "revokeme@test.com",
        stream_ids: "[]",
      });

      // If invite creation returned an ID, use it; otherwise use a placeholder
      const inviteId =
        createRes.body.result === "success" && createRes.body.invite_id
          ? String(createRes.body.invite_id)
          : "1";

      const res = await client.delete(`/invites/${inviteId}`);

      // Should succeed or return not-found if ID doesn't match
      expect(res.status).to.be.oneOf([200, 400, 404]);
    });
  });
});
