# Evaluator delivery checklist

No repository publication, Vercel deployment or demo-account creation is performed by these instructions. Complete those steps only after approval.

## 1. Publish a clean GitHub repository

1. Review `git status --short` and `git ls-files --others --exclude-standard`. Confirm that no real environment files, credentials, local configuration, logs, or raw evidence are included. Include the source, tests, lockfile, audited migration, blank public credential fields in `.env.example`, and curated documentation.
2. Stage only reviewed files. Review `git diff --cached --stat` and `git diff --cached` before creating the delivery commit. Do not force-add ignored files. Raw evidence is retained locally, not uploaded.
3. After explicit authorization, choose the GitHub repository and visibility required by the evaluator. Push the reviewed commit to the selected branch; if private, grant repository access separately. Do not send private runtime artifacts.

## 2. Configure Vercel and Supabase

1. Import the reviewed GitHub repository in Vercel. Use repository root, the **Next.js** framework preset, Node.js **22.x**, install command `npm ci --ignore-scripts`, and the framework build command (`npm run build`). Do not set a static export or custom output directory. See [Vercel build settings](https://vercel.com/docs/builds/configure-a-build).
2. Choose the stable HTTPS production origin before testing signup. Set these [Vercel environment variables](https://vercel.com/docs/environment-variables) for Production and rerun the build if they change:

   | Variable                               | Value                                        |
   | -------------------------------------- | -------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | URL for the approved Supabase project        |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Its publishable key, never a privileged key  |
   | `APP_ORIGIN`                           | Stable HTTPS origin, without a callback path |

   The first two values are browser configuration, not admin access. Do not share private data through a preview environment, and do not add any service-role key, SMTP credentials or database password to the application.

3. In Supabase Auth URL Configuration, set the Site URL for the approved public instance to its stable HTTPS origin. Add that origin's exact `/auth/confirm` callback to the redirect allowlist. Preserve the specific local callback if still needed, avoid wildcards and keep email confirmation enabled. See [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls). Do not reapply a migration already registered.
4. Confirm the deployment and project fit applicable free-plan terms and limits before provisioning. Bind the smoke check to the reviewed commit. Use a private browser window to verify the route guard, password login, create/edit/reload/delete with disposable data, Dashboard counts and logout. Confirm production logging does not retain callback query parameters. These are planned checks, not a deployed PASS.

## 3. Give the evaluator access privately

Prefer a dedicated, already-confirmed **ordinary** account on an approved demo project with no real customer data. Create or confirm an account only with authorization. Never give the evaluator an organization role, a personal owner's account, a Supabase service-role key, or dashboard credentials.

Send the app URL and login identifier privately, and share a unique temporary password through a separate agreed secure channel. Do not put credentials in GitHub, public issues, the evaluation README, logs or evidence. Revoke the demo access when evaluation ends. Test password login from a fresh browser before sharing it.

Do not rely on public signup for the demo: [Supabase's default mailer](https://supabase.com/docs/guides/auth/testing-auth-flows) is restricted to authorized team addresses, [rate-limited to two Auth emails per project per hour](https://supabase.com/docs/guides/auth/rate-limits), and [best-effort without a delivery SLA](https://supabase.com/docs/guides/auth/auth-smtp). Do not invite evaluators to the organization just to receive mail. The confirmed-account workaround avoids the known automatic-session issue without weakening confirmation or granting extra privileges. Custom SMTP is outside this delivery scope.
