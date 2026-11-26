# ClientFlow

Client and project management for the Speed Paradigm technical exercise. The workspace is in Spanish and built with Next.js App Router, TypeScript, Supabase Auth and PostgreSQL.

- Sign in with email and password; protected routes verify identity on the server.
- Create, edit and delete clients and projects. Projects belong to a client, and a client cannot be deleted while projects still reference it.
- View owner-scoped totals and project counts by status on the Dashboard.

## Start locally

Use Node.js 22.x and npm. From a fresh checkout:

```sh
npm ci --ignore-scripts
cp .env.example .env.local
```

Skip the copy if you already have `.env.local`. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your approved Supabase project. Keep `APP_ORIGIN=http://127.0.0.1:3000` for local testing. The [Supabase setup](docs/SUPABASE_SETUP.md) covers the schema, email confirmation and exact callback URL. Never put a database password or service-role key in the app.

```sh
npm run dev
```

Open <http://127.0.0.1:3000>. Until the provider is configured, the app shows configuration pending rather than opening a workspace.

## Architecture

Server pages and mutations use Supabase with a request-scoped client and verified claims. PostgreSQL RLS filters owner data, column privileges limit writes, and a composite foreign key protects project ownership. Client components handle interactive forms and confirmations. See [architecture](docs/ARCHITECTURE.md) for data flow and [project scope](docs/PROJECT_SPEC.md) for acceptance criteria.

## Manual CRUD check with your existing account

Use your own confirmed development account and the existing ignored `.env.local`; do not share its contents. Start the app with `npm run dev`, open <http://127.0.0.1:3000>, and sign in with your email and password. Note your starting Dashboard counts.

1. In **Clientes**, create a disposable test client with **Nuevo cliente**. Name is required; email, phone, company and notes are optional. Edit the name and another field, then check the list.
2. In **Proyectos**, use **Nuevo proyecto**, choose that client, and save. Edit the project name and description, and move it to **En curso**. To verify reassignment, first create a second disposable client, switch the project to that client and switch back. Check the displayed client and status after saving.
3. Return to **Dashboard**. The client/project totals and the **En curso** count should reflect only your changes. Reload the page and check again.
4. In **Clientes**, open **Eliminar** and cancel once: confirm the record remains. Try again and confirm while the client has the project: it must remain, with an explanation.
5. Delete the disposable project from **Proyectos**, then delete only the disposable clients you created. Verify the Dashboard returns to the starting counts. Do not delete existing records to test the application.

Known issue reported during hosted use: following the default confirmation email link did not establish an automatic app session. This iteration does not change confirmation behavior or diagnose the cause. If your email is already confirmed, use normal email/password login; confirmation and session establishment are separate checks.

## Checks

```sh
npm run format:check
npm run lint
npm run typecheck
npm run build
npx --no-install playwright install chromium
npm test
```

The browser download is separate from npm's package scripts. On Linux, see [Playwright browser requirements](https://playwright.dev/docs/browsers) if required system libraries are unavailable. Run the suites in a clean checkout without live credentials: the fixture uses loopback and does not require real Supabase settings. Playwright runs unconfigured, offline, mocked PKCE and loopback CRUD scenarios; none contacts a live Supabase project or delivers email. `npm run test:pkce` isolates the simulated signup, callback and session checks; `npm run test:workspace` isolates the simulated record workflows. The fixture does not constitute database or RLS proof. The application owner reported a successful manual hosted CRUD, persistence, Dashboard and deletion-restriction check. Automatic session establishment from the confirmation link remains a known limitation; independent two-user hosted RLS verification is NOT RUN.

## AI-assisted development and delivery

The Orchestrator assigned implementation and fixes to Development, froze each candidate, and assigned independent verification to Testing. The owner made product and delivery decisions. See [agent roles](AGENTS.md) and the [verification summary](docs/AGENT_EVIDENCE.md) for real handoffs, checks and limitations.

See the [GitHub and Vercel delivery checklist](docs/DEPLOYMENT.md). A pre-confirmed ordinary demo account can be provided privately after authorization; no credentials belong in this repository. The deployed build and hosted smoke test are still NOT RUN.
