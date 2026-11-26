import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

async function register(page: Page) {
  const email = 'pkce-' + randomUUID() + '@example.test';
  await page.goto('/registro');
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(email);
  await page.getByLabel('Contraseña').fill('fixture-only-password');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL('/login?estado=confirmacion');
  const request = await page.request.get(
    'http://127.0.0.1:3101/__fixture/signup?email=' + encodeURIComponent(email),
  );
  expect(request.ok()).toBe(true);
  return (await request.json()) as {
    code: string;
    redirectTo: string | null;
    hasChallenge: boolean;
    method: string;
  };
}

test('signup uses an exact callback and carries PKCE to an SSR session, reload and logout', async ({
  page,
}) => {
  const signup = await register(page);
  expect(signup.redirectTo).toBe('http://127.0.0.1:3100/auth/confirm');
  expect(signup.hasChallenge).toBe(true);
  expect(signup.method).toBe('s256');
  expect(
    (await page.context().cookies()).some(({ name }) =>
      name.includes('code-verifier'),
    ),
  ).toBe(true);
  const blocked = await page.request.get('/dashboard', { maxRedirects: 0 });
  expect(blocked.headers().location).toBe('/login');

  const response = await page.request.get('/auth/confirm', {
    params: { code: signup.code, next: 'https://example.invalid/' },
    maxRedirects: 0,
  });
  expect(response.headers().location).toBe('/dashboard');
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['set-cookie']).toContain('sb-');
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/login?estado=cerrada');
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');

  // A new verifier must not make a previously exchanged code usable again.
  await register(page);
  const replay = await page.request.get('/auth/confirm', {
    params: { code: signup.code },
    maxRedirects: 0,
  });
  expect(replay.headers().location).toBe('/login?estado=canje');
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

test('a different profile with no verifier cannot establish a session', async ({
  browser,
  page,
}) => {
  const signup = await register(page);
  const context = await browser.newContext();
  try {
    const isolated = await context.newPage();
    await isolated.goto(
      'http://127.0.0.1:3100/auth/confirm?code=' + signup.code,
    );
    await expect(isolated).toHaveURL(/\/login\?estado=canje$/);
    await expect(isolated.getByRole('status')).toContainText(
      'Si ya confirmaste',
    );
    await isolated.goto('http://127.0.0.1:3100/dashboard');
    await expect(isolated).toHaveURL(/\/login$/);
  } finally {
    await context.close();
  }
});

for (const [code, status] of [
  ['fixture-invalid', 'canje'],
  ['fixture-expired', 'canje'],
  ['fixture-transport-error', 'conexion'],
] as const) {
  test(`callback handles a ${code} response without establishing a session`, async ({
    page,
  }) => {
    await register(page);
    const response = await page.request.get('/auth/confirm', {
      params: { code },
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe('/login?estado=' + status);
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
}

for (const query of [
  'code=a&code=b',
  'code=a&token_hash=b&type=email',
  'code=',
  'next=https://example.invalid/',
  'token_hash=a&token_hash=b&type=email',
]) {
  test(`callback rejects malformed or ambiguous parameters: ${query}`, async ({
    request,
  }) => {
    const response = await request.get('/auth/confirm?' + query, {
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe('/login?estado=enlace');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
  });
}
