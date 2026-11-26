import { expect, test } from '@playwright/test';

for (const route of ['/dashboard', '/clientes', '/proyectos']) {
  test(`HTTP ${route} denies anonymous access without exposing workspace content`, async ({
    request,
  }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe('/login?estado=configuracion');
    expect(await response.text()).not.toContain('Mi espacio de trabajo');
  });
}

test('root reaches the protected dashboard', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/dashboard');
});

test('malformed confirmation returns a fixed internal destination', async ({
  request,
}) => {
  const response = await request.get('/auth/confirm', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/login?estado=enlace');
});
