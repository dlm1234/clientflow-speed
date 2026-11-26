# ClientFlow project specification

Target: a responsive business-management application built with Next.js, Supabase, and Vercel for the Speed Paradigm selection exercise. The user has authorized the functional workspace in iteration 3. Additional service changes and deployment remain unauthorized.

## Confirmed product decisions — 2026-11-25

- Next.js App Router and TypeScript; Supabase database and authentication; Vercel deployment in a later authorized iteration.
- Authentication is required in the finished product. Each user owns their records, with database RLS isolation, including project-to-client associations.
- Clients and projects have CRUD; projects belong to an existing client. Clients with projects cannot be deleted; no cascade.
- Dashboard business metrics must come from persisted data. No invented totals, sample business records, or pretend persistence.
- The interface is responsive and in Spanish. Technical documentation and identifiers remain English.
- Free services only; no Supabase/Vercel resources or credentials in iteration 1.

### Iteration 3 boundary

Implement signed-in client and project CRUD, including edit/read dialogs or list details, confirmation before deletion, and exact owner-scoped Dashboard counts. “En curso” means `in_progress`. Keep the existing SQL schema, authentication mechanics and visual identity. The reported default email-link automatic-session issue is known, not a change in this iteration. No live accounts or fixtures are created by automated verification.

### Historical iteration 2A boundary

Implement password authentication, a session-refresh proxy, server-verified route protection, and the clients/projects schema and RLS. Client email is optional; validate it when supplied. Adopt `planned`, `in_progress`, `completed`, and `cancelled` with `planned` as the default, without transition rules. Do not implement full CRUD, provision services, or apply remote migrations.

### Historical iteration 1 boundary

Authorized then: local Next.js setup, dependencies through npm, reusable layout, navigation between Dashboard/Clientes/Proyectos, honest unconnected/empty presentation, and integration-ready types and boundaries. Local shell routes are deliberately public because authentication is not implemented yet; they expose no business data. They are not an authenticated production application.

Use an explicit unconnected state, not a false claim that a database query returned zero rows. Hide unavailable business metrics or render an unavailable marker with an explanation. Do not implement CRUD, auth/session handlers, RLS policies, database access, service provisioning, or deployment in this iteration. Do not add nonfunctional create buttons that imply working CRUD.

No field lengths, uniqueness rules, status vocabulary, or transitions are finalized by this iteration. Types may describe stable entity identity, ownership and association without inventing additional product fields. Mutation reconciliation and database-level race handling remain later integration work, not iteration 1 functionality.

## Functional scope

| Area          | Required outcome                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Dashboard     | Show client total and project totals grouped by status; navigate to clients and projects; reflect persisted changes |
| Clients       | List, create, view, edit, and delete clients, with explicit confirmation for deletion                               |
| Projects      | List, create, view, edit, and delete projects associated with an existing client                                    |
| States        | Persist project status and visibly distinguish loading, empty, success, and failure states                          |
| Persistence   | Supabase is the source of truth; successful changes survive reload and a new session                                |
| Responsive UI | Usable dashboard, lists, navigation, forms, and dialogs on mobile and desktop                                       |

### Proposed product defaults — confirm before implementation

The brief does not specify fields, status names, or access model. The following are proposed acceptance fixtures, not additional confirmed employer requirements:

- Client: nonblank name required; email (valid when provided), company, phone, and notes are optional.
- Project: nonblank name, existing client, and status required; description optional.
- Project status: `planned`, `in_progress`, `completed`, `cancelled`; newly created projects default to `planned`. No transition restrictions assumed.
- Confirmed: block deletion of a client with associated projects, with an actionable explanation; no implicit cascade.
- Confirmed access model: authenticated users own their records; user A cannot access user B's records, including direct database requests and cross-owner client associations.
- Confirm uniqueness rules, field lengths, date/budget fields, and exact dashboard metrics before treating them as requirements.

## Verifiable acceptance criteria

All criteria start as NOT RUN. Testing records actual evidence per criterion; these statements are not proof of completion.

| ID    | Check                                                                                                                         | Expected result                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | With a known dataset, open dashboard; create/update/delete a project and revisit                                              | Totals match stored rows and status grouping; no stale counts after successful changes                                                                                                  |
| AC-02 | Create, open, edit, and delete a client without projects; cancel deletion first                                               | Correct fields displayed; cancel changes nothing; confirmed deletion persists                                                                                                           |
| AC-03 | Create, open, edit, and delete a project linked to a client                                                                   | Correct client association throughout; no orphaned project                                                                                                                              |
| AC-04 | Submit blank/whitespace required fields, malformed email, missing client, or unknown status through UI and server entry point | Helpful field errors; no invalid write; valid input succeeds. Apply confirmed field rules                                                                                               |
| AC-05 | Exercise every agreed project status, reload, then read dashboard                                                             | Status persists and counts match; unknown status is rejected at the persistence boundary                                                                                                |
| AC-06 | Open an empty account and empty client/project lists                                                                          | Explicit empty state with a relevant create action; no crash or misleading error                                                                                                        |
| AC-07 | Delay or fail list/create/update/delete requests                                                                              | Loading feedback and duplicate-submit prevention; readable failure and recovery action; failed writes do not appear successful or discard entered form data                             |
| AC-08 | Save changes against authorized test Supabase, reload and start a new authenticated session                                   | Stored data remains; no local-memory-only replacement. Separate integration evidence from mocked tests                                                                                  |
| AC-09 | At 360px, 768px, and 1280px widths, navigate and complete both forms                                                          | No page-level horizontal overflow; controls and dialogs remain reachable; labels, keyboard focus, and accessible errors work                                                            |
| AC-10 | Test anonymous and cross-owner reads/writes through UI, server, and direct database API                                       | Unauthorized operations denied; RLS enforced; secrets absent from browser output and evidence. Adapt fixtures to the confirmed access model                                             |
| AC-11 | Delete a client with projects; cancel and confirm normal deletions                                                            | Confirmed referential policy enforced without silent data loss; cancellation is inert                                                                                                   |
| AC-12 | Run documented automated validation/unit, data integration, and critical-flow E2E checks                                      | All applicable checks pass; covers CRUD, status persistence, empty/error states, unauthorized access, and regressions; report actual commands and counts                                |
| AC-13 | Run formatting check, lint, typecheck, tests, and production build using documented scripts once tooling exists               | Zero failing required checks; unavailable checks are BLOCKED, never silently passed                                                                                                     |
| AC-14 | After separate deployment authorization, verify Vercel production URL over HTTPS                                              | Dashboard and CRUD work with correct environment config and Supabase access controls; reload works; no uncaught console errors or leaked secrets; deployment tied to reviewed candidate |

## Delivery and test boundaries

Select test tools and commands only after application setup is authorized; no dependencies or scripts are chosen/installed by this document. Use isolated, rebuildable fixtures and never real client data. Destructive tests must not target production. Production checks use authorized disposable records only.

Production readiness is separate from a successful local build. Vercel/Supabase provisioning, plan suitability, credentials, environment setup, and deployment are pending explicit authorization and free-tier verification. Billing, paid integrations, imports, complex reporting, and additional business modules are out of scope unless requested.

## Evidence

Follow the real-evidence protocol in `../AGENTS.md`. Map each criterion to a Testing verdict, candidate identity, command/log or manual reproduction artifact, and correction/retest chain. See `AGENT_EVIDENCE.md` for observed history; iteration-specific proof does not imply full-product acceptance.
