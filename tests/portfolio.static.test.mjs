import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => readFile(path.join(root, relative), "utf8");
const [html, css, js, readme] = await Promise.all([
  read("index.html"), read("style.css"), read("script.js"), read("README.md")
]);
const attr = (source, name) => {
  const match = source.match(new RegExp("\\b" + name + "=\"([^\"]*)\""));
  return match?.[1]?.replaceAll("&amp;", "&") ?? null;
};
const contrastRatio = (hexA, hexB) => {
  const luminance = hex => {
    const [r, g, b] = hex.replace("#", "").match(/.{2}/g).map(part => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(hexA), b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const cssBlock = selector => {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, "missing CSS selector " + selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
};
const cssVar = (block, name) => {
  const match = block.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})"));
  assert.ok(match, "missing CSS custom property --" + name);
  return match[1];
};
const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const normalized = value => value.replaceAll("&amp;", "&");
const cards = [...html.matchAll(/<button class="wheel-card\b[^"]*"[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);

test("the remote-image initializer queries a collection, not a single element", () => {
  assert.ok(js.includes('  $$("img").forEach(image => {'), "image initialization must use the collection selector");
  assert.ok(!js.includes('  $("img").forEach(image => {'), "single-element selector cannot be iterated");
});

test("application JavaScript parses without syntax errors", () => {
  assert.doesNotThrow(() => new vm.Script(js, { filename: "script.js" }));
});

test("HTML IDs are unique and all in-page links resolve", () => {
  assert.equal(htmlIds.length, new Set(htmlIds).size, "duplicate HTML IDs exist");
  const ids = new Set(htmlIds);
  const anchors = [...html.matchAll(/\bhref="#([^"]+)"/g)].map(match => match[1]);
  for (const target of anchors) assert.ok(ids.has(target), "missing in-page target #" + target);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "page must have one primary heading");
});

test("all local HTML assets exist and no stale script references remain", async () => {
  assert.ok(!html.includes("mixitup.min.js"), "deleted MixItUp library is still referenced");
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => normalized(match[1]));
  const local = refs.filter(ref => !/^(?:https?:|#|mailto:|tel:|data:|javascript:)/i.test(ref));
  for (const ref of local) {
    const urlPath = decodeURIComponent(ref.split(/[?#]/, 1)[0]);
    await access(path.join(root, urlPath));
  }
  assert.ok(html.includes('src="script.js"'));
  assert.ok(html.includes('href="style.css"'));
});

test("all six project cards link to their individual source repositories", () => {
  assert.equal(cards.length, 6, "expected exactly six project cards");
  const expected = new Map([
    ["AVERIS", "https://github.com/mahitech580/averis"],
    ["TripPilot", "https://github.com/mahitech580/TripPilot-Travel-Planner"],
    ["Deepfake Video Detection", "https://github.com/mahitech580/deepfake-video-detection"],
    ["NodeAI Studio", "https://github.com/mahitech580/NodeAI-Studio"],
    ["Crop Yield Prediction", "https://github.com/mahitech580/crop-yield-predictor"],
    ["VoxGenAI", "https://github.com/mahitech580/VoxGen-AI"]
  ]);
  for (const card of cards) {
    const title = attr(card, "data-title");
    assert.ok(expected.has(title), "unexpected project title " + title);
    assert.equal(attr(card, "data-source"), expected.get(title), "wrong source repository for " + title);
  }
});

test("liquid preview choices match project-card image URLs", () => {
  const cardImages = cards.map(card => {
    const image = card.match(/<img\b[^>]*>/);
    assert.ok(image, "project card image missing");
    return normalized(attr(image[0], "src"));
  });
  const choices = [...html.matchAll(/<button\b[^>]*\bclass="[^"]*\bliquid-choice\b[^"]*"[^>]*>/g)]
    .map(match => normalized(attr(match[0], "data-image")));
  assert.equal(choices.length, 6);
  assert.deepEqual(choices, cardImages);
});

test("theme and menu controls remain accessible on small screens", () => {
  const smallScreen = css.slice(css.indexOf("@media (max-width: 420px)"));
  assert.ok(smallScreen.includes(".theme-toggle"), "mobile header styles not found");
  assert.ok(!/\.theme-toggle\s*\{\s*display:\s*none/.test(smallScreen), "theme switch is hidden on small phones");
  assert.ok(js.includes('menuToggle?.setAttribute("aria-label", "Open navigation")'));
  assert.ok(js.includes('menuToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation")'));
});

test("hero composition fits the viewport and keeps the animated word clipped to text", () => {
  assert.ok(css.includes(".hero-layout {\n  min-height: clamp(500px, calc(100svh - var(--header-height) - 145px), 590px);"), "desktop hero should not force a 650px content minimum");
  assert.ok(css.includes(".hero-visual {\n  min-height: clamp(430px, calc(100svh - var(--header-height) - 240px), 520px);"), "visual column should use a viewport-aware height");
  assert.ok(css.includes(".hero .title-metal {\n  display: inline-block;"), "gradient span should shrink to the headline word");
  assert.ok(css.includes("background-image: linear-gradient(100deg, #fffaff 0%, #d5c8ff 31%, #ffacd0 61%, #91f3f2 91%);"), "animate the image property so clipping stays explicit");
  assert.ok(css.includes("-webkit-text-fill-color: transparent;") && css.includes("-webkit-background-clip: text;"), "gradient must paint glyphs only");
});

test("hero gradient is clipped to text rather than painting a rectangular block", () => {
  const starts = [...css.matchAll(/\\.hero \\.title-metal \\{/g)].map(match => match.index);
  const rules = starts.map(index => {
    const open = css.indexOf("{", index);
    const close = css.indexOf("}", open);
    return css.slice(open + 1, close);
  });
  const block = rules.find(rule => rule.includes("-webkit-background-clip: text") && rule.includes("background-clip: text") && rule.includes("-webkit-text-fill-color: transparent"));
  assert.ok(block, "a hero gradient rule must clip the gradient to text glyphs");
  assert.ok(block.includes("-webkit-background-clip: text"), "WebKit text clipping must be reapplied after the background shorthand");
  assert.ok(block.includes("background-clip: text"), "gradient must be clipped to the title glyphs");
  assert.ok(block.includes("-webkit-text-fill-color: transparent"), "glyph fill must remain transparent for the gradient");
  assert.ok(!block.includes("background-clip: border-box"), "hero title must not paint a rectangular background");
});

test("normal-size muted and accent text meet WCAG AA contrast on light theme", () => {
  const light = cssBlock(":root");
  const paper = cssVar(light, "paper");
  const paper2 = cssVar(light, "paper-2");
  const muted = cssVar(light, "muted");
  const accentStrong = cssVar(light, "accent-strong");
  assert.ok(contrastRatio(muted, paper) >= 4.5, "muted text lacks 4.5:1 contrast on paper");
  assert.ok(contrastRatio(muted, paper2) >= 4.5, "muted text lacks 4.5:1 contrast on paper-2");
  assert.ok(contrastRatio(accentStrong, paper) >= 4.5, "strong accent lacks 4.5:1 contrast on paper");
  assert.ok(contrastRatio(accentStrong, paper2) >= 4.5, "strong accent lacks 4.5:1 contrast on paper-2");
});

test("small text and keyboard focus on dark sections remain readable", () => {
  const timelineColor = css.match(/\.journey-panel-top, \.journey-panel-foot \{[^}]*color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const wheelHintColor = css.match(/\.wheel-hint \{[^}]*color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const placeholderColor = css.match(/\.contact-form input::placeholder, \.contact-form textarea::placeholder \{[^}]*color:\s*(#[0-9a-fA-F]{6})/)?.[1];
  assert.ok(timelineColor && contrastRatio(timelineColor, "#1b1e1d") >= 4.5, "timeline labels need 4.5:1 contrast");
  assert.ok(wheelHintColor && contrastRatio(wheelHintColor, "#111313") >= 4.5, "wheel instructions need 4.5:1 contrast");
  assert.ok(placeholderColor && contrastRatio(placeholderColor, "#161918") >= 4.5, "form placeholders need 4.5:1 contrast");
  assert.ok(css.includes(".journey-section :focus-visible,") && css.includes(".work-section :focus-visible,") && css.includes(".contact-section :focus-visible { outline-color: var(--accent); }"), "dark sections need a high-contrast focus ring");
});

test("image-first project atlas includes six projects and preserves the requested portrait", () => {
  const gallery = [...html.matchAll(/<button class="project-gallery-card\b[^"]*"[^>]*data-project-index="(\d+)"[^>]*>[\s\S]*?<\/button>/g)];
  assert.equal(gallery.length, 6, "expected six visual case-file cards");
  assert.deepEqual(gallery.map(match => Number(match[1])), [0, 1, 2, 3, 4, 5]);
  for (const name of ["AVERIS", "TripPilot", "Deepfake Detection", "NodeAI Studio", "Crop Yield Prediction", "VoxGenAI"]) {
    assert.ok(gallery.some(match => match[0].includes(name)), "missing gallery project " + name);
  }
  assert.ok(html.includes('src="img/Professional%20Portrait%20in%20a%20Modern%20Office.png"'), "requested personal portrait must remain unchanged");
  assert.ok(js.includes('image.closest(".project-gallery-card")'), "gallery image failures need recovery");
  assert.ok(js.includes('const galleryCards = $$(".project-gallery-card")'), "gallery interactions must bind to the full card collection");
});

test("prismatic art direction includes colorful image backgrounds and scroll-pointer motion", () => {
  const lightTheme = css.slice(css.indexOf(":root {"), css.indexOf('html[data-theme="dark"]'));
  assert.ok(lightTheme.includes("--accent: #5f3ee8"), "light theme should use a saturated violet accent");
  assert.ok(lightTheme.includes("--accent-strong: #5b35d5"), "strong accent should keep readable contrast");
  assert.ok(css.includes("MAHI / PRISM AURORA INTERACTION LAYER"), "visual refinement block should be present");
  assert.ok(css.includes("images.unsplash.com/photo-1770954036350-b0307353f5d6"), "fluid abstract background image should be present");
  assert.ok(/background-image:\s*radial-gradient/.test(css), "atmospheric color layers should be present");
  assert.ok(css.includes("@keyframes auroraFloat") && css.includes("@keyframes spectrumFlow"), "ambient and headline animations should exist");
  assert.ok(js.includes('style.setProperty("--scroll-drift"'), "scrolling should animate the hero backdrop");
  assert.ok(js.includes('style.setProperty("--pointer-x"') && js.includes('style.setProperty("--pointer-y"'), "pointer lighting should follow the visitor");
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "motion preferences must be honored");
  assert.ok(html.includes("cdn.dribbble.com/userupload/47214616/file/d2f301ad8d0b7b873750944d54a86394.png"));
  assert.ok(html.includes("cdn.dribbble.com/userupload/46846817/file/0b9f85b7b940bdbd3ea2661952772384.png"));
  assert.ok(html.includes("orbixhub.com/assets/images/platform-dashboard.jpg"));
  assert.ok(html.includes("staging.media.fairstack.ai/image/8f9d83db-5c6f-4904-a967-6f4b93cf6f6b/81be99f4-25ba-4a1c-896d-0ff4d209deb4.png"));
  assert.ok(html.includes('src="img/Professional%20Portrait%20in%20a%20Modern%20Office.png"'), "personal portrait must remain the requested image");
});

test("gallery filter buttons are initialized as a collection and do not break page startup", () => {
  assert.ok(js.includes('const galleryFilters = $$(".gallery-filter")'), "all filter buttons must be collected");
  assert.ok(!js.includes('const galleryFilters = $(".gallery-filter")'), "a single filter element cannot support forEach");
});

test("project archive filters and counts are wired to six categorized cards", () => {
  const filterButtons = [...html.matchAll(/<button class="gallery-filter[^"]*"[^>]*data-filter="([^"]+)"/g)];
  assert.deepEqual(filterButtons.map(match => match[1]), ["all", "product", "ai", "genai"]);
  assert.equal((html.match(/data-filter-category="product"/g) || []).length, 2);
  assert.equal((html.match(/data-filter-category="ai"/g) || []).length, 2);
  assert.equal((html.match(/data-filter-category="genai"/g) || []).length, 2);
  assert.ok(html.includes('id="galleryResultCount" aria-live="polite"'));
  assert.ok(js.includes("const applyGalleryFilter = filter =>"));
  assert.ok(js.includes('card.hidden = !isVisible;'));
  assert.ok(js.includes('button.setAttribute("aria-pressed", String(isActive))'));
});

test("floating return-to-top control is accessible and scroll-aware", () => {
  assert.ok(html.includes('id="backToTop" type="button" aria-label="Back to top"'));
  assert.ok(js.includes('backToTop?.classList.toggle("is-visible", scrollY > 620)'));
  assert.ok(js.includes('window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })'));
  assert.ok(js.includes('link.setAttribute("aria-current", "location")'));
});

test("contact form keeps its configured endpoint and required fields", () => {
  const form = html.match(/<form class="contact-form\b[^"]*"[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(form, "contact form missing");
  assert.ok(form.includes('action="https://formspree.io/f/mldlkkjg"'));
  assert.ok(/method="POST"/i.test(form));
  for (const name of ["name", "email", "message"]) {
    assert.ok(new RegExp('name="' + name + '"[^>]*required|name="' + name + '"[\\s\\S]{0,180}?required', "i").test(form), name + " must remain required");
  }
});

test("3D wheel drag cannot be intercepted by native image dragging", () => {
  assert.ok(css.includes(".wheel-card img, .project-gallery-card img"), "project images should have a non-draggable interaction style");
  assert.ok(css.includes("pointer-events: none;"), "project imagery should not intercept pointer handling");
  assert.ok(js.includes("const finalDelta = event && Number.isFinite(event.clientX)"), "wheel release should reconcile drag from the pointer-up coordinate");
});

test("reduced-motion and no-JavaScript recovery remain available", () => {
  assert.ok(html.includes('window.setTimeout(() => document.getElementById("preloader")?.classList.add("is-done"), 2400)'));
  assert.ok(css.includes("html:not(.js) .preloader { display: none; }"));
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(js.includes('window.matchMedia("(prefers-reduced-motion: reduce)").matches'));
});

test("README documents cover attribution and verification commands", () => {
  assert.match(readme, /illustrative references/i);
  assert.match(readme, /npm run test:static/);
  assert.match(readme, /npm run test:e2e/);
});
