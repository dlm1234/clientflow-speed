# ClientFlow agent operating contract

This project uses one primary Orchestrator and two real custom subagents: `development` and `testing`. Read `docs/PROJECT_SPEC.md` before application work and `docs/AGENT_SETUP.md` before activating the agents.

## Current boundary

Infrastructure and specification only. Do not implement the application, scaffold Next.js, install dependencies, provision services, or deploy until the user authorizes that phase. Agent definitions alone are not evidence that delegation has occurred.

## Responsibilities

| Role | Owns | Must not do |
| --- | --- | --- |
| Orchestrator (primary session) | Scope, planning, task assignment, evidence, coordination, final acceptance | Impersonate either subagent or accept self-reported success without independent checking |
| Development (`development`) | Authorized implementation, regression tests, documentation, fixes | Expand scope, publish, or self-approve delivery |
| Testing (`testing`) | Independent inspection, test execution, reproducible findings, acceptance verdict | Edit production code, repair Development's changes, or hide failed checks |

For future application work, use the named custom roles, not merely messages labeled with role names. Only the Orchestrator spawns or coordinates agents. At most two subagent threads may be open concurrently; workers must not spawn descendants. Development and Testing operate sequentially on the same candidate, never while it is being modified.

## Delegation and correction flow

1. Orchestrator assigns a task with its ID, acceptance IDs, exact allowed edit paths, non-goals, relevant skill paths, existing helpers/invariants, and authorized verification commands. Resolve open product decisions first.
2. Spawn `development`; record the actual returned thread ID. Wait for its result before dependent work. Require changed paths, test commands/results, limitations, and candidate identity.
3. Freeze the candidate: use a commit ID when available, otherwise a SHA-256 manifest of relevant source, tests, config, and dependency files. No production edits during review.
4. Spawn `testing` on that exact candidate with the task, acceptance IDs, and Development handoff. Require independent execution, not repetition of Development's claims.
5. Testing returns PASS, FAIL, or BLOCKED for every assigned acceptance ID. Findings include severity, path/line, reproduction, expected/actual behavior, and observed output.
6. Orchestrator sends failures to Development for correction. Testing rechecks corrected findings and affected regression tests against the new candidate. Never claim success until all applicable criteria pass. If corrections or required proof remain unavailable, report the blocker; do not loop indefinitely or override user-owned review limits.
7. Orchestrator records the final verdict and unresolved risks. Independent Testing does not replace any applicable native review/consent requirement. Publishing always requires separate authorization.

## Quality and documentation

- Use deterministic RED -> GREEN -> REFACTOR for behavior changes where a runnable test exists; otherwise document the exception. No application tests are runnable in the infrastructure-only phase.
- Require validation, loading/empty/error states, persistence, security checks, accessible responsive behavior, automated tests, and production verification from the specification.
- Reuse existing project patterns. Keep artifacts in English; use the user's current language for conversation.
- Maintain setup, environment-variable names without values, architecture decisions, and reproducible run/test instructions as implementation is authorized.
- Record failed, skipped, unavailable, and pending checks explicitly. A mocked persistence test is not proof of real Supabase persistence.
- Use Conventional Commits without AI attribution when commits are authorized. No commit, push, PR, or deployment is authorized by this setup task.

## Real evidence protocol

For each future task, Orchestrator maintains `docs/evidence/<task-id>.md` and links sanitized raw artifacts under `docs/evidence/<task-id>/`. Create records only for actual events, not invented examples.

Each record must include:

- UTC timestamp, task/acceptance IDs, role, actual runtime thread ID, and assigned scope.
- Exact delegated request, candidate commit or file-hash manifest, and actual returned handoff/review reference.
- Command, working directory relative to project, tool/runtime version, exit code, relevant stdout/stderr, and artifact path/hash. Redact credentials and personal data before storage.
- Finding ID, severity, reproduction, expected/actual results, correction reference, corrected candidate, and independent retest result.
- Per-criterion PASS/FAIL/BLOCKED/NOT RUN; reason and next action for every non-pass. Record approvals and deployment URL only when actually obtained.

Keep the history of failures and corrections rather than replacing it with a final green summary. Distinguish templates, planned checks, and observed evidence. Never fabricate agent IDs, logs, screenshots, deployments, or test results.

## Safety

- Modify only explicitly authorized project paths; preserve unrelated work and global settings.
- Never run hooks pending authorization, package lifecycle scripts, destructive commands, migrations against shared data, or remote operations without the necessary explicit permission.
- Do not inspect or reuse ambient cloud credentials, SSH sessions, or accounts. Authorize destination, operation, and session before external service work.
- Use no paid services. Confirm free-tier eligibility before any future provisioning; stop if the intended use requires payment.
- Keep secrets out of source, prompts, browser bundles, logs, screenshots, and evidence. Never expose Supabase privileged keys to clients; do not disable RLS to make a test pass.
- Testing's no-production-edit rule is an instruction boundary, not an independently enforced read-only sandbox. Both agents inherit parent permissions; inspect diffs after every handoff.
- If custom roles are unavailable, stop the affected delegation and report it. Do not silently substitute a simulated three-agent workflow.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
