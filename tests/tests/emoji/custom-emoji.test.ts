import { Buffer } from "node:buffer";
import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/realm/emoji", () => {
  it("should return all custom emoji for the realm", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/realm/emoji");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("emoji");
  });

  it("should return an empty emoji object when no custom emoji exist", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/realm/emoji");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body.emoji).to.deep.equal({});
  });
});

describe("Custom emoji mutation endpoints", () => {
  const pngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2pN2QAAAAASUVORK5CYII=",
    "base64",
  );

  it("should upload, list, serve, and deactivate a custom emoji", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const uploadRes = await client.postMultipart("/realm/emoji/wave", undefined, {
      filename: "wave.png",
      contentType: "image/png",
      content: pngBytes,
    });
    expect(uploadRes.status).to.equal(200);
    expect(uploadRes.body.result).to.equal("success");

    const listRes = await client.get("/realm/emoji");
    expect(listRes.status).to.equal(200);
    const emojiEntries = Object.values(listRes.body.emoji as Record<string, Record<string, unknown>>);
    expect(emojiEntries).to.have.length(1);
    const emoji = emojiEntries[0];
    expect(emoji.name).to.equal("wave");

    const fileRes = await client.getRawBuffer(emoji.source_url as string);
    expect(fileRes.status).to.equal(200);
    expect(fileRes.body.equals(pngBytes)).to.equal(true);

    const deleteRes = await client.delete("/realm/emoji/wave");
    expect(deleteRes.status).to.equal(200);
    expect(deleteRes.body.result).to.equal("success");

    const afterDelete = await client.get("/realm/emoji");
    expect(afterDelete.body.emoji).to.deep.equal({});
  });

  it("should reject non-admin custom emoji uploads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.postMultipart("/realm/emoji/nope", undefined, {
      filename: "nope.png",
      contentType: "image/png",
      content: pngBytes,
    });

    expect(res.status).to.equal(403);
    expect(res.body.result).to.equal("error");
  });
});
