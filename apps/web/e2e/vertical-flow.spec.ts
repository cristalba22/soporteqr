import { expect, test } from '@playwright/test';

const password = 'Demo1234!';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Correo electronico').fill(email);
  await page.getByLabel('Contrasena').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function logout(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Cerrar sesi.n/ }).click();
  await expect(page).toHaveURL(/\/login$/);
}

test('empleado crea, tecnico resuelve y empleado recibe la notificacion', async ({ page, request }) => {
  await login(page, 'empleado@soporteqr.demo');
  await expect(page.getByRole('heading', { name: 'Mis solicitudes' })).toBeVisible();
  await expect(page.getByText(/únicamente los incidentes que cargaste vos/)).toBeVisible();
  await page.goto('/tickets/nuevo?activo=AST0001');
  await expect(page.getByRole('button', { name: /Escanear QR con la camara/ })).toBeVisible();
  await page.getByLabel('Titulo').fill('Flujo E2E desde Playwright');
  await page.getByLabel('Descripcion').fill('Incidencia creada en navegador para comprobar el flujo vertical completo.');
  await page.getByLabel('¿A cuantas personas afecta?').selectOption('SECTOR');
  await page.getByLabel('El trabajo quedo detenido').check();
  await page.getByLabel('Hay otro equipo o forma de continuar').uncheck();
  await page.getByRole('button', { name: 'Crear ticket' }).click();
  await expect(page).toHaveURL(/\/tickets\/[0-9a-f-]+$/);
  const ticketUrl = page.url();
  await expect(page.getByRole('heading', { name: 'Flujo E2E desde Playwright' })).toBeVisible();
  await expect(page.getByText('Prioridad calculada: Alta')).toBeVisible();

  await logout(page);
  await login(page, 'tecnico@soporteqr.demo');
  await page.goto(ticketUrl);
  await page.getByLabel('Asignar tecnico').selectOption({ label: 'Martín Gaitán' });
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(page.getByText('Asignado', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Cambiar estado').selectOption('EN_PROGRESO');
  await page.getByPlaceholder('Diagnostico (opcional)').fill('Diagnostico realizado durante el E2E.');
  await page.getByRole('button', { name: 'Guardar cambio de estado' }).click();
  await expect(page.getByText('En progreso', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Cambiar estado').selectOption('RESUELTO');
  await page.getByPlaceholder('Solucion (opcional)').fill('Solucion verificada de punta a punta.');
  await page.getByRole('button', { name: 'Guardar cambio de estado' }).click();
  await expect(page.getByText('Resuelto', { exact: true }).first()).toBeVisible();

  await logout(page);
  await login(page, 'empleado@soporteqr.demo');
  await page.goto(ticketUrl);
  await expect(page.getByText('Resuelto', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Solucion verificada de punta a punta.')).toBeVisible();

  const loginResponse = await request.post('http://127.0.0.1:4100/api/auth/login', {
    data: { email: 'empleado@soporteqr.demo', password },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const employee = await loginResponse.json();
  const notificationsResponse = await request.get('http://127.0.0.1:4100/api/notifications', {
    headers: { Authorization: `Bearer ${employee.accessToken}` },
  });
  expect(notificationsResponse.ok()).toBeTruthy();
  const notifications = await notificationsResponse.json();
  expect(notifications.notifications).toEqual(
    expect.arrayContaining([expect.objectContaining({ type: 'TICKET_RESUELTO' })]),
  );
});
