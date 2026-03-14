import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("GET /api/v1/channel_folders", () => {
  it("should return all organization channel folders sorted by order", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const first = await admin.client.post("/channel_folders/create", {
      name: "Frontend",
      description: "Channels for frontend discussions",
    });
    const second = await admin.client.post("/channel_folders/create", {
      name: "Backend",
      description: "Channels for backend discussions",
    });
    await admin.client.patch("/channel_folders", {
      order: JSON.stringify([second.body.channel_folder_id, first.body.channel_folder_id]),
    });

    const res = await member.client.get("/channel_folders");
    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("channel_folders");
    const folders = res.body.channel_folders as Array<Record<string, unknown>>;
    expect(folders).to.have.length(2);
    expect(folders[0]).to.include({
      id: second.body.channel_folder_id,
      name: "Backend",
      order: 0,
      creator_id: admin.userId,
      description: "Channels for backend discussions",
      rendered_description: "<p>Channels for backend discussions</p>",
      is_archived: false,
    });
    expect(folders[0].date_created).to.be.a("number");
    expect(folders[1]).to.include({
      id: first.body.channel_folder_id,
      name: "Frontend",
      order: 1,
      creator_id: admin.userId,
      description: "Channels for frontend discussions",
      rendered_description: "<p>Channels for frontend discussions</p>",
      is_archived: false,
    });
    expect(folders[1].date_created).to.be.a("number");
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
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/channel_folders", {
      name: "work",
      description: "Work channels",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");
    expect(res.body).to.have.property("channel_folder_id");
  });

  it("should reject non-admin users", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const res = await client.post("/channel_folders", {
      name: "work",
      description: "Work channels",
    });

    expect(res.status).to.equal(400);
    expect(res.body.code).to.equal("UNAUTHORIZED_PRINCIPAL");
  });

  it("should reject creating a folder without a name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.post("/channel_folders", {});
    expect(res.body.result).to.equal("error");
  });
});

describe("PATCH /api/v1/channel_folders/:folder_id", () => {
  it("should update a channel folder name", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    // Create folder first
    const createRes = await client.post("/channel_folders", {
      name: "work",
      description: "Work channels",
    });
    const folderId = createRes.body.channel_folder_id;

    // Update it
    const res = await client.patch(`/channel_folders/${folderId}`, {
      name: "personal",
      description: "Personal channels",
      is_archived: "true",
    });

    expect(res.status).to.equal(200);
    expect(res.body.result).to.equal("success");

    const listRes = await client.get("/channel_folders", { include_archived: "true" });
    expect((listRes.body.channel_folders as Array<Record<string, unknown>>)[0]).to.include({
      id: folderId,
      name: "personal",
      description: "Personal channels",
      is_archived: true,
    });
  });
});

describe("DELETE /api/v1/channel_folders/:folder_id", () => {
  it("should delete an existing channel folder", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId, { role: 200 });

    // Create folder first
    const createRes = await client.post("/channel_folders", {
      name: "to-delete",
      description: "",
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
    const { client } = await seedUser(db, tenantId, { role: 200 });

    const res = await client.delete("/channel_folders/nonexistent_folder_id");
    expect(res.body.result).to.equal("error");
  });
});
