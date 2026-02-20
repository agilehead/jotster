import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/channel_folders", () => {
  it("should return all channel folders for the user", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/channel_folders");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("channel_folders");
    expect(res.body.channel_folders).to.be.an("array");
  });

  it("should return empty array when user has no folders", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.get("/channel_folders");
    expect(res.status).to.equal(200);
    expect(res.body.channel_folders).to.be.an("array").with.length(0);
  });
});

describe("POST /api/v1/channel_folders", () => {
  it("should create a new channel folder", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/channel_folders", {
      name: "work",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("channel_folder_id");
  });

  it("should reject creating a folder without a name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/channel_folders", {});
    expect(res.body.result).to.equal("error");
  });
});

describe("PATCH /api/v1/channel_folders/:folder_id", () => {
  it("should update a channel folder name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Create folder first
    const createRes = await client.post("/channel_folders", {
      name: "work",
    });
    const folderId = createRes.body.channel_folder_id;

    // Update it
    const res = await client.patch(`/channel_folders/${folderId}`, {
      name: "personal",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });
});

describe("DELETE /api/v1/channel_folders/:folder_id", () => {
  it("should delete an existing channel folder", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    // Create folder first
    const createRes = await client.post("/channel_folders", {
      name: "to-delete",
    });
    const folderId = createRes.body.channel_folder_id;

    // Delete it
    const res = await client.delete(`/channel_folders/${folderId}`);
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
  });

  it("should return error when deleting a non-existent folder", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.delete("/channel_folders/nonexistent_folder_id");
    expect(res.body.result).to.equal("error");
  });
});
