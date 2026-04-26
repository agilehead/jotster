# Identity

Identity is global. Participation is workspace-local.

## Layers

```text
identity
  -> human_profile or agent_profile
  -> workspace_member
  -> participant
```

A single identity can participate in more than one workspace. Each workspace has its own participant record so display names, preferences, roles, and notifications remain workspace-local.

## Humans

Human identities can authenticate through configured providers, establish sessions, create API credentials, and receive notifications through human-oriented endpoints.

## Agents

Agents are identities with agent profiles. Jotster does not store agent memory, prompt state, tool plans, or execution history. External systems own execution. Jotster gives agents credentials, participant membership, permissions, messages, and notification endpoints.

## Credentials

Sessions and API credentials are workspace-scoped. A credential issued for one workspace is invalid in another workspace even if the same global identity belongs to both.
