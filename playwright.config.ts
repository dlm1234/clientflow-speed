import { randomUUID } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

const offline = process.env.CLIENTFLOW_TEST_MODE === 'offline';
const workspace = process.env.CLIENTFLOW_TEST_MODE === 'workspace';
const pkce = process.env.CLIENTFLOW_TEST_MODE === 'pkce';

export default defineConfig({
  testDir: './tests',
  testMatch: workspace
    ? '**/workspace.spec.ts'
    : pkce
      ? '**/auth-pkce.spec.ts'
      : offline
        ? '**/auth.spec.ts'
        : ['**/routes.spec.ts', '**/shell.spec.ts'],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  outputDir:
    process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/clientflow-playwright-results',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    ...(pkce || workspace
      ? [
          {
            command: 'node tests/fixtures/pkce-provider.mjs',
            url: 'http://127.0.0.1:3101/health',
            reuseExistingServer: false,
          },
        ]
      : []),
    {
      command: 'npm run dev -- --port 3100',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      env: {
        // No provider exists here: the reserved loopback port fails locally.
        // A generated test-only sentinel activates configuration without a credential.
        APP_ORIGIN: pkce ? 'http://127.0.0.1:3100' : '',
        NEXT_PUBLIC_SUPABASE_URL:
          pkce || workspace
            ? 'http://127.0.0.1:3101'
            : offline
              ? 'http://127.0.0.1:1'
              : '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          offline || pkce || workspace ? `sb_publishable_${randomUUID()}` : '',
      },
      timeout: 120_000,
    },
  ],
});
