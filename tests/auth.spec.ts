import { expect, test } from '@playwright/test';

for (const route of ['/dashboard', '/clientes', '/proyectos']) {
  test(`configured ${route} requires a session before returning workspace content`, async ({
    request,
  }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe('/login');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(await response.text()).not.toContain('Mi espacio de trabajo');
  });
}

for (const width of [360, 768, 1280]) {
  test(`configured login and registration expose keyboard-accessible fields at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    const email = page.getByRole('textbox', { name: 'Correo electrónico' });
    const password = page.getByLabel('Contraseña');
    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('required', '');
    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeFocused();
    await expect(
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).resolves.toBe(true);
    await page.getByRole('link', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL('/registro');
    await expect(password).toHaveAttribute('autocomplete', 'new-password');
    await expect(password).toHaveAttribute('minlength', '8');
    await page.getByRole('link', { name: 'Volver a iniciar sesión' }).click();
    await expect(page).toHaveURL('/login');
  });
}

test('server validates incomplete login before speaking to the provider', async ({
  page,
}) => {
  await page.goto('/login');
  await page.locator('form').evaluate((form) => {
    (form as HTMLFormElement).noValidate = true;
  });
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL('/login?estado=formulario');
  await expect(page.getByRole('status')).toContainText(
    'Introduce un correo válido',
  );
});

test('confirmation distinguishes a connection failure from an invalid link', async ({
  request,
}) => {
  const response = await request.get(
    '/auth/confirm?token_hash=offline-fixture&type=email',
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/login?estado=conexion');
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
});

test('signup fails closed when no trusted callback origin is configured', async ({
  page,
}) => {
  await page.goto('/registro');
  await page
    .getByRole('textbox', { name: 'Correo electrónico' })
    .fill('unavailable@example.test');
  await page.getByLabel('Contraseña').fill('fixture-only-password');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL('/registro?estado=origen');
  await expect(page.getByRole('status')).toContainText(
    'dirección de confirmación',
  );
  await expect(
    page.getByRole('link', { name: 'Volver a iniciar sesión' }),
  ).toBeVisible();
});
