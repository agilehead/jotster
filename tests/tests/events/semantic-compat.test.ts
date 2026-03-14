import { expect } from "chai";
import { testDb } from "../../test-setup.js";
import {
  seedChannel,
  seedSubscription,
  seedTenant,
  seedUser,
} from "../../utils/test-helpers.js";

const registerQueue = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  eventTypes: string[],
): Promise<{ queueId: string; lastEventId: number }> => {
  const registerRes = await client.post("/register", {
    event_types: JSON.stringify(eventTypes),
  });

  expect(registerRes.status).to.equal(200);
  expect(registerRes.body.result).to.equal("success");

  return {
    queueId: registerRes.body.queue_id as string,
    lastEventId: registerRes.body.last_event_id as number,
  };
};

const getEvents = async (
  client: Awaited<ReturnType<typeof seedUser>>["client"],
  queueId: string,
  lastEventId: number,
): Promise<Array<Record<string, unknown>>> => {
  const res = await client.get("/events", {
    queue_id: queueId,
    last_event_id: String(lastEventId),
    dont_block: "true",
  });

  expect(res.status).to.equal(200);
  expect(res.body.result).to.equal("success");
  return res.body.events as Array<Record<string, unknown>>;
};

describe("Semantic Zulip event compatibility", function () {
  this.timeout(20000);

  it("should emit alert_words events without synthetic op fields", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const { queueId, lastEventId } = await registerQueue(user.client, ["alert_words"]);

    const addRes = await user.client.post("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug", "urgent"]),
    });
    expect(addRes.status).to.equal(200);

    const addEvents = await getEvents(user.client, queueId, lastEventId);
    expect(addEvents).to.have.length(1);
    expect(addEvents[0].id).to.be.a("number");
    expect(addEvents[0].type).to.equal("alert_words");
    expect(addEvents[0]).to.not.have.property("op");
    expect(addEvents[0].alert_words).to.have.members(["bug", "urgent"]);

    const removeRes = await user.client.delete("/users/me/alert_words", {
      alert_words: JSON.stringify(["bug"]),
    });
    expect(removeRes.status).to.equal(200);

    const removeEvents = await getEvents(user.client, queueId, addEvents[0].id as number);
    expect(removeEvents).to.have.length(1);
    expect(removeEvents[0].type).to.equal("alert_words");
    expect(removeEvents[0]).to.not.have.property("op");
    expect(removeEvents[0].alert_words).to.deep.equal(["urgent"]);
  });

  it("should emit drafts events and draft payloads with Zulip-compatible arrays", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const user = await seedUser(db, tenantId);
    const channelId = await seedChannel(db, tenantId, { name: "draft-events" });
    await seedSubscription(db, tenantId, user.userId, channelId);
    const { queueId, lastEventId } = await registerQueue(user.client, ["drafts"]);

    const createRes = await user.client.post("/drafts", {
      drafts: JSON.stringify([
        {
          type: "stream",
          to: [channelId],
          topic: "Draft topic",
          content: "First draft",
          timestamp: Math.floor(Date.now() / 1000),
        },
      ]),
    });
    expect(createRes.status).to.equal(200);
    const draftId = (createRes.body.ids as string[])[0];

    const listRes = await user.client.get("/drafts");
    expect(listRes.status).to.equal(200);
    expect(listRes.body.count).to.equal(1);
    const listedDraft = (listRes.body.drafts as Array<Record<string, unknown>>).find((entry) => entry["id"] === draftId);
    expect(listedDraft).to.not.equal(undefined);
    expect(listedDraft).to.deep.equal({
      id: draftId,
      type: "stream",
      to: [channelId],
      topic: "Draft topic",
      content: "First draft",
      timestamp: listedDraft!["timestamp"],
    });

    const createEvents = await getEvents(user.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "drafts",
      op: "add",
      drafts: [
        {
          id: draftId,
          type: "stream",
          to: [channelId],
          topic: "Draft topic",
          content: "First draft",
          timestamp: listedDraft!["timestamp"],
        },
      ],
    });

    const updateRes = await user.client.patch(`/drafts/${draftId}`, {
      draft: JSON.stringify({
        type: "stream",
        to: [channelId],
        topic: "Edited topic",
        content: "Updated draft",
        timestamp: Math.floor(Date.now() / 1000) + 1,
      }),
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(user.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    const updatedDraft = updateEvents[0].draft as Record<string, unknown>;
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "drafts",
      op: "update",
      draft: {
        id: draftId,
        type: "stream",
        to: [channelId],
        topic: "Edited topic",
        content: "Updated draft",
        timestamp: updatedDraft["timestamp"],
      },
    });

    const deleteRes = await user.client.delete(`/drafts/${draftId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(user.client, queueId, updateEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "drafts",
      op: "remove",
      draft_id: draftId,
    });
  });

  it("should emit channel_folder add, update, reorder, and remove events with Zulip-compatible payloads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const { queueId, lastEventId } = await registerQueue(admin.client, ["channel_folder"]);

    const createRes = await admin.client.post("/channel_folders", {
      name: "Frontend",
      description: "Frontend discussions",
    });
    expect(createRes.status).to.equal(200);
    const firstFolderId = createRes.body.channel_folder_id as string;

    const createEvents = await getEvents(admin.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    const createdFolder = createEvents[0].channel_folder as Record<string, unknown>;
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "channel_folder",
      op: "add",
      channel_folder: {
        id: firstFolderId,
        name: "Frontend",
        description: "Frontend discussions",
        rendered_description: "<p>Frontend discussions</p>",
        date_created: createdFolder["date_created"],
        creator_id: admin.userId,
        is_archived: false,
      },
    });

    const updateRes = await admin.client.patch(`/channel_folders/${firstFolderId}`, {
      name: "Web frontend",
      description: "Web frontend discussions",
      is_archived: "true",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(admin.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "channel_folder",
      op: "update",
      channel_folder_id: firstFolderId,
      data: {
        name: "Web frontend",
        description: "Web frontend discussions",
        rendered_description: "<p>Web frontend discussions</p>",
        is_archived: true,
      },
    });

    const secondRes = await admin.client.post("/channel_folders", {
      name: "Backend",
      description: "Backend discussions",
    });
    expect(secondRes.status).to.equal(200);
    const secondFolderId = secondRes.body.channel_folder_id as string;

    const secondCreateEvents = await getEvents(admin.client, queueId, updateEvents[0].id as number);
    expect(secondCreateEvents).to.have.length(1);

    const reorderRes = await admin.client.patch("/channel_folders", {
      order: JSON.stringify([secondFolderId, firstFolderId]),
    });
    expect(reorderRes.status).to.equal(200);

    const reorderEvents = await getEvents(admin.client, queueId, secondCreateEvents[0].id as number);
    expect(reorderEvents).to.have.length(1);
    expect(reorderEvents[0]).to.deep.equal({
      id: reorderEvents[0].id,
      type: "channel_folder",
      op: "reorder",
      order: [secondFolderId, firstFolderId],
    });

    const deleteRes = await admin.client.delete(`/channel_folders/${firstFolderId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(admin.client, queueId, reorderEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "channel_folder",
      op: "remove",
      channel_folder_id: firstFolderId,
    });
  });

  it("should emit user_group lifecycle events with Zulip-compatible payloads", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const member = await seedUser(db, tenantId);

    const subgroupRes = await admin.client.post("/user_groups/create", {
      name: "child-group",
      description: "Child group",
    });
    expect(subgroupRes.status).to.equal(200);
    const subgroupId = subgroupRes.body.group.id as string;

    const { queueId, lastEventId } = await registerQueue(admin.client, ["user_group"]);

    const createRes = await admin.client.post("/user_groups/create", {
      name: "parent-group",
      description: "Parent group",
      members: JSON.stringify([admin.userId]),
    });
    expect(createRes.status).to.equal(200);
    const groupId = createRes.body.group.id as string;

    const createEvents = await getEvents(admin.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    const createdGroup = createEvents[0].group as Record<string, unknown>;
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "user_group",
      op: "add",
      group: {
        id: groupId,
        name: "parent-group",
        description: "Parent group",
        is_system_group: false,
        members: [admin.userId],
        direct_subgroup_ids: [],
        can_add_members_group: null,
        can_join_group: null,
        can_leave_group: null,
        can_manage_group: null,
        can_mention_group: null,
        can_remove_members_group: null,
        creator_id: admin.userId,
        date_created: createdGroup["date_created"],
        deactivated: false,
      },
    });

    const updateRes = await admin.client.patch(`/user_groups/${groupId}`, {
      description: "Updated parent group",
      can_remove_members_group: "role:members",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(admin.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "user_group",
      op: "update",
      group_id: groupId,
      data: {
        description: "Updated parent group",
        can_remove_members_group: "role:members",
      },
    });

    const addMembersRes = await admin.client.post(`/user_groups/${groupId}/members`, {
      add: JSON.stringify([member.userId]),
    });
    expect(addMembersRes.status).to.equal(200);

    const addMembersEvents = await getEvents(admin.client, queueId, updateEvents[0].id as number);
    expect(addMembersEvents).to.have.length(1);
    expect(addMembersEvents[0]).to.deep.equal({
      id: addMembersEvents[0].id,
      type: "user_group",
      op: "add_members",
      group_id: groupId,
      user_ids: [member.userId],
    });

    const addSubgroupRes = await admin.client.post(`/user_groups/${groupId}/members`, {
      add_subgroups: JSON.stringify([subgroupId]),
    });
    expect(addSubgroupRes.status).to.equal(200);

    const addSubgroupEvents = await getEvents(admin.client, queueId, addMembersEvents[0].id as number);
    expect(addSubgroupEvents).to.have.length(1);
    expect(addSubgroupEvents[0]).to.deep.equal({
      id: addSubgroupEvents[0].id,
      type: "user_group",
      op: "add_subgroups",
      group_id: groupId,
      direct_subgroup_ids: [subgroupId],
    });

    const removeMembersRes = await admin.client.post(`/user_groups/${groupId}/members`, {
      delete: JSON.stringify([member.userId]),
    });
    expect(removeMembersRes.status).to.equal(200);

    const removeMembersEvents = await getEvents(admin.client, queueId, addSubgroupEvents[0].id as number);
    expect(removeMembersEvents).to.have.length(1);
    expect(removeMembersEvents[0]).to.deep.equal({
      id: removeMembersEvents[0].id,
      type: "user_group",
      op: "remove_members",
      group_id: groupId,
      user_ids: [member.userId],
    });

    const removeSubgroupsRes = await admin.client.post(`/user_groups/${groupId}/members`, {
      delete_subgroups: JSON.stringify([subgroupId]),
    });
    expect(removeSubgroupsRes.status).to.equal(200);

    const removeSubgroupEvents = await getEvents(admin.client, queueId, removeMembersEvents[0].id as number);
    expect(removeSubgroupEvents).to.have.length(1);
    expect(removeSubgroupEvents[0]).to.deep.equal({
      id: removeSubgroupEvents[0].id,
      type: "user_group",
      op: "remove_subgroups",
      group_id: groupId,
      direct_subgroup_ids: [subgroupId],
    });

    const deactivateRes = await admin.client.post(`/user_groups/${groupId}/deactivate`);
    expect(deactivateRes.status).to.equal(200);

    const deactivateEvents = await getEvents(admin.client, queueId, removeSubgroupEvents[0].id as number);
    expect(deactivateEvents).to.have.length(1);
    expect(deactivateEvents[0]).to.deep.equal({
      id: deactivateEvents[0].id,
      type: "user_group",
      op: "remove",
      group_id: groupId,
    });

    const reactivateRes = await admin.client.patch(`/user_groups/${groupId}`, {
      deactivated: false,
    });
    expect(reactivateRes.status).to.equal(200);

    const reactivateEvents = await getEvents(admin.client, queueId, deactivateEvents[0].id as number);
    expect(reactivateEvents).to.have.length(1);
    const reactivatedGroup = reactivateEvents[0].group as Record<string, unknown>;
    expect(reactivateEvents[0]).to.deep.equal({
      id: reactivateEvents[0].id,
      type: "user_group",
      op: "add",
      group: {
        id: groupId,
        name: "parent-group",
        description: "Updated parent group",
        is_system_group: false,
        members: [],
        direct_subgroup_ids: [],
        can_add_members_group: null,
        can_join_group: null,
        can_leave_group: null,
        can_manage_group: null,
        can_mention_group: null,
        can_remove_members_group: "role:members",
        creator_id: admin.userId,
        date_created: reactivatedGroup["date_created"],
        deactivated: false,
      },
    });
  });

  it("should emit custom_profile_fields events with required and editable_by_user metadata", async () => {
    const db = testDb.getDb();
    const tenantId = await seedTenant(db);
    const admin = await seedUser(db, tenantId, { role: 200 });
    const { queueId, lastEventId } = await registerQueue(admin.client, ["custom_profile_fields"]);

    const createRes = await admin.client.post("/realm/profile_fields", {
      name: "Phone number",
      hint: "Work phone",
      field_type: "1",
    });
    expect(createRes.status).to.equal(200);
    const firstFieldId = createRes.body.id as string;

    const listRes = await admin.client.get("/realm/profile_fields");
    expect(listRes.status).to.equal(200);
    expect(listRes.body.custom_fields).to.deep.equal([
      {
        id: firstFieldId,
        name: "Phone number",
        hint: "Work phone",
        type: 1,
        field_data: "",
        order: 1,
        required: false,
        editable_by_user: true,
      },
    ]);

    const createEvents = await getEvents(admin.client, queueId, lastEventId);
    expect(createEvents).to.have.length(1);
    expect(createEvents[0]).to.deep.equal({
      id: createEvents[0].id,
      type: "custom_profile_fields",
      fields: [
        {
          id: firstFieldId,
          name: "Phone number",
          hint: "Work phone",
          type: 1,
          field_data: "",
          order: 1,
          required: false,
          editable_by_user: true,
        },
      ],
    });

    const updateRes = await admin.client.patch(`/realm/profile_fields/${firstFieldId}`, {
      hint: "Updated phone",
      display_in_profile_summary: "true",
    });
    expect(updateRes.status).to.equal(200);

    const updateEvents = await getEvents(admin.client, queueId, createEvents[0].id as number);
    expect(updateEvents).to.have.length(1);
    expect(updateEvents[0]).to.deep.equal({
      id: updateEvents[0].id,
      type: "custom_profile_fields",
      fields: [
        {
          id: firstFieldId,
          name: "Phone number",
          hint: "Updated phone",
          type: 1,
          field_data: "",
          order: 1,
          display_in_profile_summary: true,
          required: false,
          editable_by_user: true,
        },
      ],
    });

    const secondRes = await admin.client.post("/realm/profile_fields", {
      name: "GitHub",
      hint: "Username",
      field_type: "7",
      field_data: "{\"subtype\":\"github\"}",
    });
    expect(secondRes.status).to.equal(200);
    const secondFieldId = secondRes.body.id as string;

    const secondCreateEvents = await getEvents(admin.client, queueId, updateEvents[0].id as number);
    expect(secondCreateEvents).to.have.length(1);

    const reorderRes = await admin.client.patch("/realm/profile_fields", {
      order: JSON.stringify([secondFieldId, firstFieldId]),
    });
    expect(reorderRes.status).to.equal(200);

    const reorderEvents = await getEvents(admin.client, queueId, secondCreateEvents[0].id as number);
    expect(reorderEvents).to.have.length(1);
    expect(reorderEvents[0]).to.deep.equal({
      id: reorderEvents[0].id,
      type: "custom_profile_fields",
      fields: [
        {
          id: secondFieldId,
          name: "GitHub",
          hint: "Username",
          type: 7,
          field_data: "{\"subtype\":\"github\"}",
          order: 0,
          required: false,
          editable_by_user: true,
        },
        {
          id: firstFieldId,
          name: "Phone number",
          hint: "Updated phone",
          type: 1,
          field_data: "",
          order: 1,
          display_in_profile_summary: true,
          required: false,
          editable_by_user: true,
        },
      ],
    });

    const deleteRes = await admin.client.delete(`/realm/profile_fields/${firstFieldId}`);
    expect(deleteRes.status).to.equal(200);

    const deleteEvents = await getEvents(admin.client, queueId, reorderEvents[0].id as number);
    expect(deleteEvents).to.have.length(1);
    expect(deleteEvents[0]).to.deep.equal({
      id: deleteEvents[0].id,
      type: "custom_profile_fields",
      fields: [
        {
          id: secondFieldId,
          name: "GitHub",
          hint: "Username",
          type: 7,
          field_data: "{\"subtype\":\"github\"}",
          order: 0,
          required: false,
          editable_by_user: true,
        },
      ],
    });
  });
});
