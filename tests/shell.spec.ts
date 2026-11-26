import { expect, test } from '@playwright/test';

for (const width of [360, 768, 1280]) {
  test(`public authentication boundary is accessible at ${width}px without provider setup`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [path, heading] of [
      ['/dashboard', 'Iniciar sesión'],
      ['/clientes', 'Iniciar sesión'],
      ['/proyectos', 'Iniciar sesión'],
      ['/registro', 'Crear cuenta'],
    ]) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.getByRole('main')).toBeVisible();
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible();
      await expect(page.getByRole('status')).toContainText(
        'Configuración pendiente',
      );
      await expect(page.getByRole('navigation')).toHaveCount(0);
      await expect(page.getByRole('button', { name: heading })).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.getByText('Todavía no tienes clientes')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('browser reaches the login gate from the original home route', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL('/login?estado=configuracion');
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión' }),
  ).toBeVisible();
});
