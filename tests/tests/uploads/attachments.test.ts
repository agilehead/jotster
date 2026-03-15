import { Buffer } from "node:buffer";
import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

const TEXT_FILE = Buffer.from("hello from jotster upload", "utf8");

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

    it("POST /api/v1/user_uploads, GET /api/v1/attachments, GET /user_uploads/{realm_id_str}/{filename}, and DELETE /api/v1/attachments/{attachment_id} should work", async () => {
      const db = testDb.getDb();
      const tenantId = await seedTenant(db);
      const { client } = await seedUser(db, tenantId);

      const uploadRes = await client.postMultipart("/user_uploads", undefined, {
        filename: "zulip.txt",
        contentType: "text/plain",
        content: TEXT_FILE,
      });

      expect(uploadRes.status).to.equal(200);
      expect(uploadRes.body.result).to.equal("success");
      expect(uploadRes.body.uri).to.equal(uploadRes.body.url);
      expect(uploadRes.body.filename).to.equal("zulip.txt");

      const listRes = await client.get("/attachments");
      expect(listRes.status).to.equal(200);
      const attachments = listRes.body.attachments as Array<Record<string, unknown>>;
      expect(attachments).to.have.length(1);
      const attachment = attachments[0];
      expect(attachment.name).to.equal("zulip.txt");

      const fileRes = await client.getRawBuffer(uploadRes.body.url as string);
      expect(fileRes.status).to.equal(200);
      expect(fileRes.body.equals(TEXT_FILE)).to.equal(true);

      const deleteRes = await client.delete(`/attachments/${attachment.id as string}`);
      expect(deleteRes.status).to.equal(200);
      expect(deleteRes.body.result).to.equal("success");

      const afterDelete = await client.get("/attachments");
      expect((afterDelete.body.attachments as Array<unknown>)).to.have.length(0);
    });
  });
});
