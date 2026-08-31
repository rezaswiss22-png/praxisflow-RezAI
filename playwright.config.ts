import { defineConfig, devices } from '@playwright/test';

/**
 * PraxisFlow AI – Playwright-Konfiguration (E2E Smoke-Tests)
 * PILOT: Ausschliesslich synthetische Testdaten.
 *
 * Voraussetzung: Datenbank läuft, Migrationen angewandt, Seed geladen.
 * Der Dev-Server wird bei Bedarf automatisch gestartet.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
