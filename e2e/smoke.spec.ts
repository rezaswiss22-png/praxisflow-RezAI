import { test, expect } from '@playwright/test';

/**
 * PraxisFlow AI – E2E Smoke-Tests
 * PILOT: Ausschliesslich synthetische Testdaten.
 *
 * Diese Tests prüfen die wichtigsten Einstiegspfade der Pilot-App:
 *  - Pilot-Banner ist sichtbar und weist auf synthetische Daten hin
 *  - Login-Seite ist erreichbar
 *  - Anmeldung mit synthetischem Testkonto führt ins Dashboard
 */

test('Pilot-Banner ist auf der Login-Seite sichtbar', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(
    page.getByText(/PILOTUMGEBUNG/i),
  ).toBeVisible();
  await expect(
    page.getByText(/synthetische Testdaten/i),
  ).toBeVisible();
});

test('Login-Formular wird angezeigt', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
  await expect(page.getByLabel(/Passwort/i)).toBeVisible();
});

test('Anmeldung mit synthetischem Arzt-Konto führt ins Dashboard', async ({
  page,
}) => {
  await page.goto('/auth/login');

  await page.getByLabel(/E-Mail/i).fill('dr.mueller@praxisflow.test');
  await page.getByLabel(/Passwort/i).fill('Pilot2026!');
  await page.getByRole('button', { name: /Anmelden/i }).click();

  // Nach erfolgreicher Anmeldung: Weiterleitung ins Dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await expect(
    page.getByText(/PILOTUMGEBUNG/i),
  ).toBeVisible();
});
