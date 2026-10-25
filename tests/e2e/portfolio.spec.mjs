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

test("desktop hero title, intro, and portrait stay within the first viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1648, height: 785 });
  const title = page.locator(".hero .title-metal");
  const portrait = page.locator(".hero-portrait");
  await expect(title).toBeVisible();
  await expect(portrait).toBeVisible();
  const styles = await title.evaluate(el => ({
    backgroundImage: getComputedStyle(el).backgroundImage,
    fill: getComputedStyle(el).webkitTextFillColor,
    width: el.getBoundingClientRect().width
  }));
  expect(styles.backgroundImage).toBe("none");
  expect(styles.fill).toBe("rgb(255, 179, 213)");
  expect(styles.width).toBeLessThan(640);
  const heroBox = await page.locator("#home").boundingBox();
  const portraitBox = await portrait.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(portraitBox).not.toBeNull();
  expect(heroBox.y + heroBox.height).toBeLessThanOrEqual(785);
  expect(portraitBox.y).toBeLessThan(785);
  expect(portraitBox.y + portraitBox.height).toBeLessThanOrEqual(785);
  await expect(page.getByRole("link", { name: /Explore my work/ })).toBeVisible();
});


test("personal portrait remains anchored as the cursor moves across the hero", async ({ page }) => {
  await page.setViewportSize({ width: 1648, height: 785 });
  const portrait = page.locator(".hero-portrait");
  const visual = page.locator("#heroVisual");
  await expect(portrait).toBeVisible();
  await portrait.evaluate(image => image.decode());
  const before = await portrait.boundingBox();
  const visualBox = await visual.boundingBox();
  expect(before).not.toBeNull();
  expect(visualBox).not.toBeNull();
  await page.mouse.move(visualBox.x + visualBox.width * .22, visualBox.y + visualBox.height * .28);
  await page.mouse.move(visualBox.x + visualBox.width * .82, visualBox.y + visualBox.height * .72, { steps: 8 });
  await page.waitForTimeout(100);
  const after = await portrait.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  const transform = await portrait.evaluate(el => getComputedStyle(el).transform);
  expect(transform).toBe("none");
});

test("personal portrait stays fixed when the cursor moves across the hero", async ({ page }) => {
  await page.setViewportSize({ width: 1648, height: 900 });
  const portrait = page.locator(".hero-portrait");
  const visual = page.locator("#heroVisual");
  await expect(portrait).toBeVisible();
  await visual.scrollIntoViewIfNeeded();
  const before = await portrait.boundingBox();
  const bounds = await visual.boundingBox();
  expect(before).not.toBeNull();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds.x + bounds.width * .25, bounds.y + bounds.height * .30);
  await page.mouse.move(bounds.x + bounds.width * .78, bounds.y + bounds.height * .68, { steps: 8 });
  const after = await portrait.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
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
  await cover.evaluate(image => new Promise(resolve => {
    image.addEventListener("error", resolve, { once: true });
    image.loading = "eager";
    image.src = "/__intentional_missing_cover_test__.png";
  }));
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

test("image atlas opens the matching project modal and repository link", async ({ page }) => {
  const gallery = page.locator("#projectGallery");
  await expect(gallery.locator(".project-gallery-card")).toHaveCount(6);
  await gallery.getByRole("button", { name: "Open NodeAI Studio project details" }).click();
  await expect(page.locator("#projectModal")).toHaveClass(/is-open/);
  await expect(page.locator("#modalTitle")).toHaveText("NodeAI Studio");
  await expect(page.locator("#modalLinks a")).toHaveCount(1);
  await expect(page.locator("#modalLinks a").first()).toHaveAttribute("href", "https://github.com/mahitech580/NodeAI-Studio");
  await page.keyboard.press("Escape");
  await expect(page.locator("#projectModal")).not.toHaveClass(/is-open/);
});

test("project filters show the matching category and restore all cards", async ({ page }) => {
  const cards = page.locator("#projectGallery .project-gallery-card");
  await expect(cards).toHaveCount(6);
  await page.getByRole("button", { name: /AI \/ ML/ }).click();
  await expect(cards.filter({ visible: true })).toHaveCount(2);
  await expect(page.locator('#projectGallery [data-project-index="2"]')).toBeVisible();
  await expect(page.locator('#projectGallery [data-project-index="4"]')).toBeVisible();
  await expect(page.locator("#galleryResultCount")).toHaveText("SHOWING 02 / 06 BUILDS");
  await expect(page.getByRole("button", { name: /AI \/ ML/ })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /GenAI & tools/ }).click();
  await expect(cards.filter({ visible: true })).toHaveCount(2);
  await expect(page.locator('#projectGallery [data-project-index="3"]')).toBeVisible();
  await expect(page.locator('#projectGallery [data-project-index="5"]')).toBeVisible();

  await page.getByRole("button", { name: /All builds/ }).click();
  await expect(cards.filter({ visible: true })).toHaveCount(6);
  await expect(page.locator("#galleryResultCount")).toHaveText("SHOWING 06 / 06 BUILDS");
});

test("hero portrait stays anchored and the hero avoids horizontal overflow at key widths", async ({ page }) => {
  const widths = [320, 375, 390, 768, 1024, 1648];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 1648 ? 785 : 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const portrait = page.locator(".hero-portrait");
    await expect(portrait).toBeVisible();
    await expect.poll(() => portrait.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document, "horizontal overflow at viewport " + width).toBeLessThanOrEqual(dimensions.viewport);
    expect(await portrait.evaluate(image => getComputedStyle(image).transform)).toBe("none");
  }
});

test("floating back-to-top control appears on scroll and returns to the hero", async ({ page }) => {
  const control = page.locator("#backToTop");
  await expect(control).toHaveCount(1);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(control).toHaveClass(/is-visible/);
  await control.click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4_000 }).toBeLessThan(160);
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

test("mobile form fields avoid Safari auto-zoom and primary controls have usable tap targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const theme = page.locator("#themeToggle");
  const menu = page.locator("#menuToggle");
  for (const control of [theme, menu]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const filter = page.locator(".gallery-filter").first();
  const filterBox = await filter.boundingBox();
  expect(filterBox?.height).toBeGreaterThanOrEqual(44);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  for (const field of [page.locator('.contact-form input[name="name"]'), page.locator('.contact-form input[name="email"]'), page.locator('.contact-form textarea[name="message"]')]) {
    await expect(field).toBeVisible();
    const size = await field.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  }
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});
