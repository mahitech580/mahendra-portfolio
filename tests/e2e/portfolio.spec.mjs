import { test, expect } from "@playwright/test";

const pageErrorsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrorsByPage.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#preloader")).toBeHidden({ timeout: 5_000 });
});

test.afterEach(async ({ page }) => {
  expect(pageErrorsByPage.get(page) || []).toEqual([]);
});

test("core page, portrait, resume and form load", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await expect(page).toHaveTitle(/Mahi.*Software Engineer/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".hero-portrait")).toBeVisible();
  await expect.poll(() => page.locator(".hero-portrait").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);

  await expect(page.locator('a[href="files/Mahendra_Resume_Python__.pdf"]').first()).toBeVisible();
  const form = page.locator('form[action="https://formspree.io/f/mldlkkjg"]');
  await expect(form).toHaveAttribute("method", /post/i);
  await expect(form.locator('[name="name"]')).toHaveAttribute("required", "");
  await expect(form.locator('[name="email"]')).toHaveAttribute("required", "");
  await expect(form.locator('[name="message"]')).toHaveAttribute("required", "");
  expect(pageErrors).toEqual([]);
});

test("project next, card click, modal links and Escape all work", async ({ page }) => {
  await page.locator("#wheelNext").click();
  await expect(page.locator("#workIndex")).toHaveText("02");
  await expect(page.locator("#selectedProjectTitle")).toHaveText("TripPilot");

  await page.locator('#projectWheel .wheel-card[data-index="1"]').click();
  await expect(page.locator("#projectModal")).toHaveClass(/is-open/);
  await expect(page.locator("#modalTitle")).toHaveText("TripPilot");
  await expect(page.locator("#modalClose")).toBeFocused();

  const links = page.locator("#modalLinks a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://mahitech580.github.io/TripPilot-Travel-Planner/");
  await expect(links.nth(1)).toHaveAttribute("href", "https://github.com/mahitech580/TripPilot-Travel-Planner");

  await page.keyboard.press("Escape");
  await expect(page.locator("#projectModal")).not.toHaveClass(/is-open/);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("project wheel responds to arrow keys and Enter", async ({ page }) => {
  await page.locator("#wheelViewport").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#workIndex")).toHaveText("02");
  await expect(page.locator("#selectedProjectTitle")).toHaveText("TripPilot");
  await page.keyboard.press("Enter");
  await expect(page.locator("#projectModal")).toHaveClass(/is-open/);
});

test("horizontal drag rotates the wheel without opening a project", async ({ page }) => {
  const card = page.locator('#projectWheel .wheel-card[data-index="0"]');
  await card.scrollIntoViewIfNeeded();
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 - 120, bounds.y + bounds.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator("#workIndex")).toHaveText("02");
  await expect(page.locator("#projectModal")).not.toHaveClass(/is-open/);
});

test("liquid preview selection stays synchronized with project details", async ({ page }) => {
  await page.getByRole("button", { name: "Preview Crop Yield AI" }).click();
  await expect(page.locator("#liquidLabel")).toHaveText("CROP YIELD AI / PROJECT 05");
  await expect(page.locator("#workIndex")).toHaveText("05");
  await expect(page.locator("#selectedProjectTitle")).toHaveText("Crop Yield Prediction");
});

test("remote cover failures show designed placeholders", async ({ page }) => {
  const cover = page.locator('#projectWheel .wheel-card[data-index="0"] img');
  await cover.evaluate(image => { image.src = "/__intentional_missing_cover_test__.png"; });
  const card = page.locator('#projectWheel .wheel-card[data-index="0"]');
  await expect(card).toHaveClass(/image-failed/);
  await expect(cover).toHaveCSS("visibility", "hidden");
});

test("mobile theme and navigation controls remain usable and labelled", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const themeButton = page.locator("#themeToggle");
  const menuButton = page.locator("#menuToggle");
  await expect(themeButton).toBeVisible();
  await expect(menuButton).toBeVisible();

  await themeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#preloader")).toBeHidden({ timeout: 5_000 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menuButton).toHaveAttribute("aria-label", "Close navigation");
  await expect(page.locator("#mainNav")).toBeVisible();
  await page.locator('#mainNav a[href="#about"]').click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toHaveAttribute("aria-label", "Open navigation");

  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test("reduced-motion preference keeps essential content visible", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#preloader")).toBeHidden();
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#journeyTrack")).toBeVisible();
  await context.close();
});
