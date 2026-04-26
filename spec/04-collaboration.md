# Collaboration

Collaboration owns workspace content and conversation structure.

## Channels

Channels are workspace-owned containers. Visibility controls discovery and join behavior. Membership records hold participant-specific channel state such as role, mute state, and timestamps.

## Threads

Threads are first-class rows. They are not message metadata. A channel message belongs to a thread, and thread policy can later support permissions, follows, mutes, and history without reshaping messages.

## Direct Chats

Direct chats are workspace-owned containers with explicit members. They use the same message model as channel threads, with `container_kind` identifying the target shape.

## Messages

A message stores author participant, content, rendered content, state, and its container reference. Edits create message version rows. Markers and reactions are participant-scoped rows.

## Attachments And Emoji

Attachments and emoji are workspace-owned assets. Storage keys are implementation details; permission checks use workspace, owner participant, message, and resource paths.
