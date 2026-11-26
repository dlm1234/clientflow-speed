import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, email = randomUUID() + '@example.test') {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill('fixture-only-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL('/dashboard');
}

test('creates, edits and deletes linked records, with live counts from the provider', async ({
  page,
}) => {
  await signIn(page);
  await expect(
    page.getByRole('region', { name: 'Resumen de tu actividad' }),
  ).toContainText('0');
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await expect(
    page.getByText('Crea un cliente antes de añadir un proyecto.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Taller Norte');
  await dialog.getByLabel('Empresa').fill('Taller');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cliente creado.')).toBeVisible();
  await page.getByRole('button', { name: 'Editar Taller Norte' }).click();
  await dialog.getByLabel('Nombre').fill('Taller Sur');
  await dialog.getByLabel('Correo electrónico').fill('taller@example.test');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cliente actualizado.')).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await dialog.getByLabel('Nombre').fill('Taller Este');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Taller Este' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
  await dialog.getByLabel('Nombre').fill('Catálogo');
  await dialog
    .getByRole('combobox', { name: 'Cliente', exact: true })
    .selectOption({ label: 'Taller Este' });
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Proyecto creado.')).toBeVisible();
  await page.getByRole('button', { name: 'Editar Catálogo' }).click();
  await dialog.getByLabel('Nombre').fill('Catálogo digital');
  await dialog.getByLabel('Descripción').fill('Primera versión');
  await dialog
    .getByRole('combobox', { name: 'Cliente', exact: true })
    .selectOption({ label: 'Taller Sur' });
  await dialog
    .getByRole('combobox', { name: 'Estado' })
    .selectOption('in_progress');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Proyecto actualizado.')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Catálogo digital' }),
  ).toBeVisible();
  await expect(page.getByText('Taller Sur', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByTestId('metric-clients')).toHaveText('2');
  await expect(page.getByTestId('metric-projects')).toHaveText('1');
  await expect(page.getByTestId('metric-in-progress')).toHaveText('1');
  await page.reload();
  await expect(page.getByTestId('status-in_progress')).toHaveText('1');

  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Taller Sur' }).click();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('heading', { name: 'Taller Sur' })).toBeVisible();
  await page.getByRole('button', { name: 'Eliminar Taller Sur' }).click();
  await dialog.getByRole('button', { name: 'Eliminar' }).click();
  await expect(dialog.getByRole('alert')).toContainText('proyectos asociados');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Catálogo digital' }).click();
  await dialog.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Proyecto eliminado.')).toBeVisible();
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar Taller Sur' }).click();
  await dialog.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Cliente eliminado.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Taller Sur' })).toHaveCount(
    0,
  );
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByTestId('metric-clients')).toHaveText('1');
  await expect(page.getByTestId('metric-projects')).toHaveText('0');
});

test('validates names, retains a failed draft and keeps another session’s data separate', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await signIn(page);
  await page.goto('/clientes');
  await expect(page.getByText('Todavía no tienes clientes.')).toBeVisible();
  const create = page.getByRole('button', { name: 'Nuevo cliente' });
  await create.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  const name = dialog.getByRole('textbox', { name: 'Nombre' });
  await expect(dialog).toBeVisible();
  await expect(name).toBeFocused();
  await name.fill('   ');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(
    'Introduce el nombre del cliente.',
  );
  await name.fill('Error simulado');
  await dialog
    .getByRole('textbox', { name: 'Empresa' })
    .fill('Borrador conservado');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog.getByRole('alert')).toContainText('No se pudo guardar');
  await expect(dialog.getByRole('textbox', { name: 'Empresa' })).toHaveValue(
    'Borrador conservado',
  );
  await name.fill('Solo en mi espacio');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Solo en mi espacio' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);

  const otherContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
  });
  try {
    const other = await otherContext.newPage();
    await signIn(other);
    await other.goto('http://127.0.0.1:3100/clientes');
    await expect(other.getByText('Todavía no tienes clientes.')).toBeVisible();
    await expect(
      other.getByRole('heading', { name: 'Solo en mi espacio' }),
    ).toHaveCount(0);
    await other.goto('http://127.0.0.1:3100/proyectos');
    await expect(
      other.getByRole('button', { name: 'Nuevo proyecto' }),
    ).toBeDisabled();
  } finally {
    await otherContext.close();
  }
});

test('a stale record cannot report a successful update', async ({
  page,
  browser,
}) => {
  const email = randomUUID() + '@example.test';
  await signIn(page, email);
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: 'Nombre' })
    .fill('Duplicado de sesión');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await page
    .getByRole('button', { name: 'Editar Duplicado de sesión' })
    .click();
  const ownerContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100',
  });
  try {
    const sameOwner = await ownerContext.newPage();
    await signIn(sameOwner, email);
    await sameOwner.goto('/clientes');
    await sameOwner
      .getByRole('button', { name: 'Eliminar Duplicado de sesión' })
      .click();
    await sameOwner
      .getByRole('dialog')
      .getByRole('button', { name: 'Eliminar' })
      .click();
    await expect(sameOwner.getByText('Cliente eliminado.')).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Nombre' }).fill('Ya no existe');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByRole('alert')).toHaveText(
      'El registro no está disponible o ya no existe.',
    );
    await expect(page.getByText('Cliente actualizado.')).toHaveCount(0);
  } finally {
    await ownerContext.close();
  }
});

test('read failures do not turn into empty lists or invented zero metrics', async ({
  page,
}) => {
  await signIn(page, 'read-error-' + randomUUID() + '@example.test');
  const alert = page
    .getByRole('alert')
    .filter({ hasText: 'No se pudieron consultar los registros' });
  await expect(alert).toBeVisible({ timeout: 12000 });
  await expect(page.getByTestId('metric-clients')).toHaveCount(0);
  await page.goto('/clientes');
  await expect(alert).toBeVisible({ timeout: 12000 });
  await expect(page.getByText('Todavía no tienes clientes.')).toHaveCount(0);
});
