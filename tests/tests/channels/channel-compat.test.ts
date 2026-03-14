import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import { seedChannel, seedMessage, seedSubscription, seedTenant, seedUser } from "../../utils/test-helpers.js";

describe("Channel compatibility endpoints", () => {
  it("should create and reorder channel folders via Zulip-compatible routes", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const { client } = await seedUser(db, tenantId);

    const folderOne = await client.post("/channel_folders/create", { name: "alpha" });
    const folderTwo = await client.post("/channel_folders/create", { name: "beta" });

    expect(folderOne.status).to.equal(200);
    expect(folderTwo.status).to.equal(200);

    const firstId = folderOne.body.channel_folder_id as string;
    const secondId = folderTwo.body.channel_folder_id as string;

    const reorderRes = await client.patch("/channel_folders", {
      order: JSON.stringify([secondId, firstId]),
    });
    expect(reorderRes.status).to.equal(200);

    const rows = await db("channel_folder")
      .select("id", "ordering")
      .whereIn("id", [firstId, secondId]);
    const ordering = new Map(rows.map((row) => [row.id as string, row.ordering as number]));
    expect(ordering.get(firstId)).to.equal(1);
    expect(ordering.get(secondId)).to.equal(0);
  });

  it("should return a stream email address and delete a topic", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db, { subdomain: "compat-mail" });
    const { client, userId } = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "support" });
    await seedSubscription(db, tenantId, userId, channelId);

    const emailRes = await client.get(`/streams/${channelId}/email_address`);
    expect(emailRes.status).to.equal(200);
    expect(emailRes.body.email_address).to.equal(`channel-${channelId}@compat-mail.jotster.local`);

    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "cleanup",
      content: "Delete me",
    });
    await seedMessage(db, tenantId, userId, {
      channelId,
      topic: "cleanup",
      content: "Delete me too",
    });

    const deleteRes = await client.post(`/streams/${channelId}/delete_topic`, {
      topic_name: "cleanup",
    });
    expect(deleteRes.status).to.equal(200);
    expect(deleteRes.body.complete).to.equal(true);

    const remaining = await db("message").where({ tenant_id: tenantId, channel_id: channelId, topic: "cleanup" });
    expect(remaining).to.have.length(0);
  });
});
