import { defineConfig, devices } from "@playwright/test";

// Browser tests for the real site, 3D room included. The room needs WebGL, which headless
// Chromium draws in software with SwiftShader, so these run on any CI machine without a GPU.
// CHROME_PATH points at a local Chrome when Playwright's own download isn't available.
const PORT = Number(process.env.PORT ?? 3100);
const chromeArgs = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const launchOptions = {
  args: chromeArgs,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
};

export default defineConfig({
  testDir: "./e2e",
  // Software WebGL is slow: the room takes a few seconds to build on a CI machine.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "iphone",
      // iPhone screen, touch and user agent, drawn by Chromium. Real Safari quirks still need a phone.
      use: { ...devices["iPhone 15 Pro"], browserName: "chromium", launchOptions },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions },
    },
  ],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
