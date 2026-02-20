import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Attachments and Uploads", () => {
  describe("GET /api/v1/attachments", () => {
    it("should return an empty list of attachments initially", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const res = await client.get("/attachments");

      expect(res.status).to.equal(200);
      expect(res.body.result).to.equal("success");
      expect(res.body).to.have.property("attachments");
      expect(res.body.attachments).to.be.an("array").that.is.empty;
    });
  });

  describe("POST /api/v1/user_uploads", () => {
    it("should return an error when no file is provided", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      // POST without a file should result in an error since multipart upload is required
      const res = await client.post("/user_uploads");

      expect(res.body.result).to.equal("error");
      expect(res.body).to.have.property("msg");
    });
  });
});
