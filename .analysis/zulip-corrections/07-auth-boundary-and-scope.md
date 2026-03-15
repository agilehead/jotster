# Auth Boundary and Scope

## 1. Auth contract rule

Internal auth implementation is allowed to differ from Zulip.

Accepted internal freedom:

- OAuth-backed browser login
- OAuth-backed token issuance
- internal session/token architecture different from Zulip

Required external rule:

- the public API contract must remain Zulip-compatible wherever auth is part of that contract

That means:

- API-key fetch/regenerate flows remain compatible
- bot auth remains compatible
- authenticated API behavior remains compatible
- request/response/error shapes remain compatible

## 2. What is explicitly out of scope

Per user decision, these endpoints remain excluded:

- `POST /realm/playgrounds`
- `DELETE /realm/playgrounds/{playground_id}`
- `GET /calls/bigbluebutton/create`
- `POST /calls/nextcloud_talk/create`
- `POST /calls/constructorgroups/create`

Those exclusions are already reflected in:

- `.analysis/api-compat/02-summary.md:13`

## 3. What is not excluded

Everything else in the in-scope Zulip API is subject to the full correction plan, including:

- identifier type corrections
- event payload corrections
- state/bootstrap corrections
- domain/repo/storage corrections
- contract-level test coverage

## 4. Non-goals

This plan is not trying to preserve:

- old Jotster string-ID behavior for public resources
- old local database compatibility
- old hybrid API payloads
- convenience bridge helpers as permanent product features

The correct bias is:

- break the old architecture if needed
- converge on the right Zulip-native architecture
