/**
 * Browser-level E2E smoke & federated flow specification for Playwright.
 * Run against live stack (`pnpm dev`) via `npx playwright test -c e2e/playwright.config.ts`.
 */
export interface E2EPage {
  goto(url: string): Promise<unknown>;
  locator(selector: string): {
    waitFor(): Promise<void>;
    click(): Promise<void>;
  };
}

export async function verifyFederatedShellAndRemotesJourney(page: E2EPage): Promise<void> {
  // 1. Load Shell Host & Community Remote (:5001)
  await page.goto('/communities');
  await page.locator('text=Communities & Rider Blogs').waitFor();

  // 2. Navigate to Group Rides (:5002)
  await page.goto('/rides');
  await page.locator('text=Group Ride Organization').waitFor();

  // 3. Navigate to Roadside Help (:5003)
  await page.goto('/help');
  await page.locator('text=Roadside Assistance & Peer Help').waitFor();

  // 4. Navigate to Mechanics (:5004)
  await page.goto('/mechanics');
  await page.locator('text=Mechanics & Service Providers').waitFor();

  // 5. Navigate to Garage (:5005)
  await page.goto('/garage');
  await page.locator('text=My Garage & Service Logbook').waitFor();

  // 6. Navigate to Marketplace (:5006)
  await page.goto('/marketplace');
  await page.locator('text=Secondhand Cars & Bikes Marketplace').waitFor();

  // 7. Navigate to Admin & Moderation Console (/admin)
  await page.goto('/admin');
  await page.locator('text=Administrator & Moderation Center').waitFor();
}

