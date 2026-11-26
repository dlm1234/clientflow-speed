# ClientFlow verification evidence

This is the public summary of observed work, not a raw transcript. The detailed local evidence and original verification history are preserved privately and excluded from the publication candidate.

AI assisted implementation and testing under human direction. The Orchestrator bounded the scope, delegated to real Development and Testing roles, froze candidates by hash, and coordinated corrections. Testing independently reviewed each frozen candidate; the application owner separately exercised the live development workflow.

## Observed milestones

| Scope                        | Actual agent execution references                                                              | Evidence and limitations                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial design               | `/root/architecture_review`, `/root/acceptance_review`                                         | Independent architecture and acceptance-criteria reviews; no implementation claimed at this stage.                                                                                                     |
| Workspace shell              | `/root/iteration1_contrast_fix`, `/root/iteration1_revalidation`                               | Initial Chromium execution was blocked by its environment. Later Testing measured seven insufficient text contrasts; Development corrected them and independent retest passed 10 local tests.          |
| Supabase integration         | `/root/iteration2a_development`, `/root/iteration2a_testing`                                   | Testing reproduced misleading confirmation error classification; Development corrected it and independent verification passed 17 local tests.                                                          |
| Migration audit              | `/root/iteration2b_audit`, `/root/iteration2b_corrections`, `/root/iteration2c_catalog_review` | Audited schema and corrected rollback-only test coverage. Testing later matched the supplied remote history and catalog with the migration. Structural evidence only; not live two-user RLS proof.     |
| PKCE                         | `/root/iteration2d_dev`, `/root/iteration2d_testing`, `/root/iteration2d_retest`               | An independent run was interrupted. A fresh Testing run passed format, lint, types, build and 28 local tests, including a loopback PKCE provider.                                                      |
| Functional workspace         | `/root/iteration3_dev`, `/root/iteration3_testing`                                             | Frozen candidate passed format, lint, types, build and 32 independent local tests: 9 unconfigured, 9 offline, 10 mocked PKCE and 4 mocked workspace. No reproduced defect required a correction cycle. |
| Real development smoke check | Application owner (reported)                                                                   | Password sign-in and creation, editing, persistence, statistics and linked-client deletion restriction worked against hosted Supabase. Not an independent two-user run.                                |

## Delivery verification — 2026-11-26

Development (`/root/delivery_development`) prepared the public checkout and evaluator documentation. Testing (`/root/delivery_testing`) independently found that the broad Node engine range could override the documented Node 22 choice on Vercel. Development pinned Node 22.x in the package manifest and lockfile; Testing independently revalidated the corrected candidate. No application code changed in this phase.

| Check | Result |
| --- | --- |
| Clean `npm ci --ignore-scripts` | PASS; 382 packages installed into the isolated checkout |
| Format, lint, types and production build | PASS, exit 0 each on Node 22 |
| Browser/HTTP suite | PASS, 32/32; local unconfigured, offline and simulated-provider scenarios |
| Publication inventory and route/security review | PASS within scope; no credential pattern matches, private routes and writes retain server-side identity checks |
| Hosted two-user RLS, evaluator account and Vercel smoke | NOT RUN; not authorized or provisioned |

The owner's reported live CRUD smoke check remains separate. No repository commit, publication, deployment or remote mutation occurred during delivery preparation.

## Outstanding verification

- **Known limitation:** email confirmation works for later password login, but automatic app session establishment from the standard confirmation link did not work in the reported hosted flow. Local PKCE mocks do not contradict this. Use a previously confirmed, ordinary account for the demo.
- **NOT RUN:** two-user hosted RLS isolation, live session renewal and production/Vercel smoke checks. A matching catalog does not prove cross-user isolation, and the Playwright fixture is not a hosted provider.
- Publication, deployment and creating a demo account are separate actions. See the [delivery checklist](DEPLOYMENT.md).
