import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Acceptance tests run against the built output in dist/ (run `npm run build` first;
// `npm test` does). They never use the dev server.
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    viewport: { width: 800, height: 450 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/version.json`,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 800, height: 450 },
        // Lets headless Chromium fall back to software WebGL on machines without a GPU.
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 800, height: 450 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 800, height: 450 } } },
  ],
});
