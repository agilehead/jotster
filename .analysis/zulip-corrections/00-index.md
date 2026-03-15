# Zulip Corrections Plan

This directory is the authoritative redesign plan for making Jotster behave like a Zulip-compatible system from the core outward.

The governing rule for this plan is:

- no legacy compatibility layer
- no dual public/internal identity model for Zulip-visible resources
- no permanent translation bridge
- no “good enough” route parity without contract parity

Target end state:

- if a resource is Zulip-visible and Zulip identifies it by integer ID, Jotster stores and exposes it as an integer ID
- if a field is Zulip-typed, Jotster uses that type in storage, domain, handler, event, and test layers
- internal design should look like a system built for Zulip compatibility from day one

Files:

- `01-problem-statement.md` — exact statement of what is wrong today
- `02-root-cause-analysis.md` — why the current architecture drifted away from Zulip
- `03-target-zulip-native-model.md` — target data, type, API, and event model
- `04-remaining-work-inventory.md` — exhaustive pending work by subsystem
- `05-execution-plan.md` — phased implementation sequence with cutover rules
- `06-success-criteria-and-gates.md` — what counts as done, and what validation is required
- `07-auth-boundary-and-scope.md` — auth contract rules, exclusions, and non-goals

Read order:

1. `01-problem-statement.md`
2. `03-target-zulip-native-model.md`
3. `04-remaining-work-inventory.md`
4. `05-execution-plan.md`
5. `06-success-criteria-and-gates.md`
