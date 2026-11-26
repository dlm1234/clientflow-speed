# ClientFlow architecture

## Iteration 3 workspace

Protected server pages and each workspace mutation reuse the verified-claims session helper. The workspace queries select only displayed or needed fields and explicitly filter by the verified owner, in addition to RLS. Project client choices come from the same owner's list; the server verifies the client again for writes. Inserts omit the owner so the database chooses it. Updates and deletes filter by both owner and record, and require an affected row before reporting success. The composite foreign key is authoritative even after an application check; the UI explains a refused client deletion without cascading. Success revalidates the Clients, Projects and Dashboard routes.

The Dashboard requests exact counts rather than counting a truncated response. “En curso” corresponds to `in_progress`; the distribution uses the other permitted states without inventing totals. Counts may reflect slightly different instants if another session writes concurrently. If any count query fails, the UI shows a retryable error rather than misleading zeroes. Views use a loading boundary only after authentication, keeping the pre-authenticated redirect. CRUD dialogs preserve input on a rejected submission; the server does not expose provider details in UI messages.

The Playwright loopback fixture implements just the exercised Data API contract and never uses the deployed project. Those checks do not prove PostgreSQL constraints, hosted writes or RLS isolation. See the [manual workspace check](../README.md#manual-crud-check-with-your-existing-account).

## Historical iteration 2A

Browser and request-scoped server clients use only Supabase’s public project URL and publishable key. Next.js 16 proxy refreshes cookies and applies cache headers; no protected page treats it as an authorization gate. Each protected page independently verifies claims through the request-scoped server helper. Route handlers and server actions write cookies; Server Components do not. Provider failures and missing configuration never render the protected shell. The confirmation callback only accepts the signup email token type and always redirects internally.

Clients and Projects perform owner-filtered presence checks with RLS, selecting only an ID and limiting to one row. No result, a failed query, unauthenticated access and missing configuration have separate states. Authentication responses are not shared-cacheable. Data writes are not exposed in the UI.

The PostgreSQL migration uses SQL grants for permitted columns, explicit per-operation RLS for authenticated users, and a composite owner/client foreign key for ownership integrity independent of policies. Secret keys are not used. Verification details and instructions are in [Supabase setup](SUPABASE_SETUP.md).

## Iteration 1 historical design

Iteration 1 implements only a public, Spanish-language application shell. It deliberately has no database, session, business records, metrics, mutation controls or service provisioning.

## Historical iteration 1 structure

| Boundary                 | Responsibility                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `src/app`                | Root document (`lang="es"`), metadata, dashboard/client/project routes, and root redirect |
| `src/components`         | Shared shell, pathname-aware navigation, decorative icons, and disconnected presentation  |
| `src/domain/entities.ts` | Stable readonly identity, owner and project-to-client association types                   |
| `tests/shell.spec.ts`    | Browser checks at the public route boundary, without database mocks                       |

Pages remain server components. Only active navigation needs client-side pathname state. Plain CSS, system fonts and inline decorative SVG avoid external font/image dependencies. A persistent desktop sidebar becomes an in-flow navigation bar on narrow screens; links remain available without a menu toggle.

## Historical absence of data

“Sin conexión de datos” means **no data integration exists**, not that a successful database query returned an empty collection. There is no repository returning synthetic empty arrays, local-storage persistence, fake customer identity, or numeric business total. Page copy states what is pending; working links navigate only between implemented sections.

The domain contracts distinguish user/client/project identifiers and carry ownership and association. They do not settle names, email uniqueness, field lengths or status vocabulary. They are TypeScript contracts, not runtime validation or proof of authorization.

## Historical integration proposal

After separate authorization, introduce a small server-only data-access layer using user-scoped Supabase requests. Keep authentication and authorization at server entry points and RLS at the database boundary. Enforce that a project belongs to a client owned by the same user, and block deleting referenced clients at the database level. Never trust an owner ID submitted by the browser.

Thin mutations can delegate to the data layer and revalidate affected dashboard/list/detail routes after successful persistence. Next.js documents this [data-access boundary](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/data-security.mdx) and [mutation revalidation](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/server-actions.mdx). Supabase documents [RLS policies](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx); policies and real cross-user integration tests are still pending.

Tradeoff: a compact feature-oriented data layer avoids a separate backend and premature generic repositories, but couples initial orchestration to Next.js. Do not build that abstraction until actual integration is authorized. Tests must distinguish real Supabase evidence from mocks, and deletion integrity must survive overlapping database requests.

## Verification boundary

Iteration 1 browser checks covered navigation, direct routes, reload, Spanish document language, disconnected messaging, basic landmarks/accessible names, keyboard skip/navigation and horizontal overflow at 360/768/1280 pixels. They do not verify forms, authentication, RLS, persistence or production readiness. All full-product acceptance criteria remain NOT RUN until their actual scenarios can be exercised; scoped shell checks are not substitutes.

Use the commands in the [README](../README.md). No Git hooks, deployments, service credentials or paid resources are required for this foundation.
