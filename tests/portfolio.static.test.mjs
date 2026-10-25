import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => readFile(path.join(root, relative), "utf8");
const [html, css, js, readme, headers] = await Promise.all([
  read("index.html"), read("style.css"), read("script.js"), read("README.md"), read("_headers")
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

test("all twelve project cards link to their individual source repositories", () => {
  assert.equal(cards.length, 12, "expected twelve project cards");
  const expected = new Map([
    ["AVERIS", "https://github.com/mahitech580/averis"],
    ["TripPilot", "https://github.com/mahitech580/TripPilot-Travel-Planner"],
    ["Deepfake Video Detection", "https://github.com/mahitech580/deepfake-video-detection"],
    ["NodeAI Studio", "https://github.com/mahitech580/NodeAI-Studio"],
    ["Crop Yield Prediction", "https://github.com/mahitech580/crop-yield-predictor"],
    ["VoxGenAI", "https://github.com/mahitech580/VoxGen-AI"],
    ["StockFlow", "https://github.com/mahitech580/StockFlow"],
    ["DataVision Intelligence", "https://github.com/mahitech580/DataVision-Intelligence"],
    ["CINEPLAY — AI Movie Recommender", "https://github.com/mahitech580/AI-Movie-Recommender"],
    ["Banking & Financial Transaction Management", "https://github.com/mahitech580/Banking-Financial-Transaction-Management-MySQL"],
    ["LastMileIQ SQL", "https://github.com/mahitech580/LastMileIQ-SQL"],
    ["AI Resume Analyzer", "https://github.com/mahitech580/AI-Resume-Analyzer"]
  ]);
  for (const card of cards) {
    const title = attr(card, "data-title");
    assert.ok(expected.has(title), "unexpected project title " + title);
    assert.equal(attr(card, "data-source"), expected.get(title), "wrong source repository for " + title);
  }
});

test("liquid preview choices match the first six wheel projects and all other projects sync dynamically", () => {
  const cardImages = cards.slice(0, 6).map(card => {
    const image = card.match(/<img\b[^>]*>/);
    assert.ok(image, "project card image missing");
    return normalized(attr(image[0], "src"));
  });
  const choices = [...html.matchAll(/<button\b[^>]*\bclass="[^"]*\bliquid-choice\b[^"]*"[^>]*>/g)]
    .map(match => normalized(attr(match[0], "data-image")));
  assert.equal(cards.length, 12);
  assert.equal(choices.length, 6);
  assert.deepEqual(choices, cardImages);
  assert.ok(js.includes("Keep the large preview synchronized even for projects beyond the six quick-pick buttons."));
});

test("theme and menu controls remain accessible on small screens", () => {
  const smallScreen = css.slice(css.indexOf("@media (max-width: 420px)"));
  assert.ok(smallScreen.includes(".theme-toggle"), "mobile header styles not found");
  assert.ok(!/\.theme-toggle\s*\{\s*display:\s*none/.test(smallScreen), "theme switch is hidden on small phones");
  assert.ok(js.includes('menuToggle?.setAttribute("aria-label", "Open navigation")'));
  assert.ok(js.includes('menuToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation")'));
});

test("CSE image art direction uses coding, AI/ML and space imagery—not electronics imagery", () => {
  assert.ok(css.includes('photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=72'), "coding laptop background should be efficiently sized");
  assert.ok(css.includes('photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=72'), "AI/ML imagery should be efficiently sized in the skills section");
  assert.ok(html.includes('src="'+imgUrl+'"'), "colorful laptop-and-code artwork should be used in the scroll showcase");
  assert.ok(html.includes('src="img/Professional%20Portrait%20in%20a%20Modern%20Office.png"'), "keep the requested personal portrait");
  assert.ok(css.includes('.hero::before') && css.includes('linear-gradient(105deg, rgba(13, 10, 32, .94)'), "hero must retain a dark readable overlay over coding imagery");
  assert.ok(!/circuit board|electronics engineering|pcb imagery/i.test(css + html), "avoid electronics-focused imagery and language");
});

test("hero has one consolidated, viewport-aware composition and solid headline accent", () => {
  assert.ok(css.includes(".hero-layout { min-height: clamp(485px, calc(100svh - var(--header-height) - 158px), 580px);"), "hero layout should fit the viewport rather than force a tall minimum");
  assert.ok(css.includes("height: clamp(360px, calc(100svh - var(--header-height) - 330px), 455px);"), "portrait column should use viewport-aware sizing");
  assert.ok(css.includes(".hero .title-metal {"), "headline accent rule should exist");
  assert.ok(css.includes("background: none;") && css.includes("background-image: none;"), "headline word must not paint a rectangular gradient");
  assert.ok(css.includes("-webkit-text-fill-color: #ffb3d5;"), "headline uses a reliable solid accent instead of fragile gradient clipping");
  assert.ok(!css.includes("HERO COMPOSITION FIX") && !css.includes("Desktop hero corrective pass"), "obsolete appended hero override blocks should be removed");
});

test("portrait remains stationary and the hero offers a resume link", () => {
  assert.ok(css.includes(".hero-portrait {") && css.includes("transform: none !important;"), "portrait base rule must never translate");
  assert.ok(!css.includes("translate3d(var(--pointer-x"), "global pointer coordinates must not reposition the portrait");
  assert.ok(html.includes('class="text-link hero-resume"'), "hero should expose a direct resume action");
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

test("image-first project atlas includes all twelve projects and preserves the requested portrait", () => {
  const gallery = [...html.matchAll(/<button class="project-gallery-card\b[^"]*"[^>]*data-project-index="(\d+)"[^>]*>[\s\S]*?<\/button>/g)];
  assert.equal(gallery.length, 12, "expected twelve visual case-file cards");
  assert.deepEqual(gallery.map(match => Number(match[1])), Array.from({ length: 12 }, (_, index) => index));
  for (const name of ["AVERIS", "TripPilot", "Deepfake Video Detection", "NodeAI Studio", "Crop Yield Prediction", "VoxGenAI", "StockFlow", "DataVision Intelligence", "CINEPLAY", "Banking &amp; Financial Transaction Management", "LastMileIQ SQL", "AI Resume Analyzer"]) {
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
  assert.ok(css.includes("images.unsplash.com/photo-1498050108023-c5249f4df085"), "coding laptop background should be present");
  assert.ok(css.includes("images.unsplash.com/photo-1677442136019-21780ecad995"), "AI / ML visual background should be present");
  assert.ok(html.includes("media2.dev.to/dynamic/image/width%3D1600%2Cheight%3D900"), "colorful laptop-and-code image should be present in the scroll showcase");
  assert.ok(/background-image:\s*radial-gradient/.test(css), "atmospheric color layers should be present");
  assert.ok(css.includes("@keyframes auroraFloat") && css.includes("@keyframes spectrumFlow"), "ambient and headline animations should exist");
  assert.ok(js.includes('style.setProperty("--scroll-drift"'), "scrolling should animate the hero backdrop");
  assert.ok(js.includes('style.setProperty("--pointer-x"') && js.includes('style.setProperty("--pointer-y"'), "pointer lighting should follow the visitor");
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "motion preferences must be honored");
  assert.ok(html.includes("photo-1576091160399-112ba8d25d1d?auto=format&amp;fit=crop&amp;w=960&amp;q=78"), "healthcare project uses matching artwork");
  assert.ok(html.includes("photo-1464822759023-fed622ff2c3b?auto=format&amp;fit=crop&amp;w=960&amp;q=78"), "travel project uses matching artwork");
  assert.ok(html.includes("photo-1500382017468-9049fed747ef?auto=format&amp;fit=crop&amp;w=960&amp;q=78"), "crop prediction project uses matching artwork");
  assert.ok(html.includes("photo-1598488035139-bdbb2231ce04?auto=format&amp;fit=crop&amp;w=960&amp;q=78"), "voice AI project uses matching artwork");
  assert.ok(html.includes('src="img/Professional%20Portrait%20in%20a%20Modern%20Office.png"'), "personal portrait must remain the requested image");
});

test("gallery filter buttons are initialized as a collection and do not break page startup", () => {
  assert.ok(js.includes('const galleryFilters = $$(".gallery-filter")'), "all filter buttons must be collected");
  assert.ok(!js.includes('const galleryFilters = $(".gallery-filter")'), "a single filter element cannot support forEach");
});

test("the personal portrait stays still when the pointer moves", () => {
  assert.ok(!js.includes('heroVisual.style.setProperty("--pointer-x"'), "pointer movement must not translate the personal portrait");
  assert.ok(!js.includes('heroVisual.style.setProperty("--pointer-y"'), "pointer movement must not translate the personal portrait");
  assert.ok(/\.hero-portrait,\s*\.hero-visual:hover \.hero-portrait\s*\{\s*transform:\s*none !important;/.test(css), "portrait transforms should be disabled on hover");
});

test("project archive filters and counts are wired to twelve categorized cards", () => {
  const filterButtons = [...html.matchAll(/<button class="gallery-filter[^"]*"[^>]*data-filter="([^"]+)"/g)];
  assert.deepEqual(filterButtons.map(match => match[1]), ["all", "product", "ai", "genai", "data"]);
  assert.equal((html.match(/data-filter-category="product"/g) || []).length, 3);
  assert.equal((html.match(/data-filter-category="ai"/g) || []).length, 5);
  assert.equal((html.match(/data-filter-category="genai"/g) || []).length, 2);
  assert.equal((html.match(/data-filter-category="data"/g) || []).length, 2);
  assert.ok(html.includes('id="galleryResultCount" aria-live="polite"'));
  assert.ok(js.includes("const applyGalleryFilter = filter =>"));
  assert.ok(js.includes('card.hidden = !isVisible;'));
  assert.ok(js.includes('button.setAttribute("aria-pressed", String(isActive))'));
  assert.ok(js.includes('event.key === "ArrowLeft" || event.key === "ArrowRight"'), "global arrow controls need both directions");
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
  assert.ok(html.includes('window.setTimeout(() => document.getElementById("preloader")?.classList.add("is-done"), 1200)'));
  assert.ok(css.includes("html:not(.js) .preloader { display: none; }"));
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"));
  assert.ok(js.includes('window.matchMedia("(prefers-reduced-motion: reduce)").matches'));
});

test("README documents cover attribution and verification commands", () => {
  assert.match(readme, /illustrative references/i);
  assert.match(readme, /npm run test:static/);
  assert.match(readme, /npm run test:e2e/);
});

test("Netlify canonical metadata, lightweight backgrounds and named interactive containers are accessible", () => {
  assert.ok(html.includes('<link rel="canonical" href="https://mahendrasai.netlify.app/">'), "Netlify is the canonical production URL");
  assert.ok(html.includes('<meta property="og:url" content="https://mahendrasai.netlify.app/">'), "Open Graph URL matches production");
  assert.ok(html.includes('class="ticker" role="img" aria-label="Areas of focus:'), "decorative ticker has a valid accessible name");
  assert.ok(html.includes('class="tech-cloud reveal" role="group" aria-label="Technology and engineering skills"'), "technology cloud is a labelled group");
  assert.ok(html.includes('id="wheelViewport" tabindex="0" role="region" aria-label="Interactive 3D project wheel.'), "keyboard project wheel has a named region");
  assert.ok(html.includes('data-live="https://averis-saas.netlify.app/"'), "Averis points to its current Netlify deployment");
  assert.ok(css.includes('photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=72'), "coding background uses a lower transfer size");
  assert.ok(css.includes('photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=72'), "AI background uses a lower transfer size");
});

test("accent hover states use the theme-aware foreground token", () => {
  assert.ok(css.includes(".icon-button:hover { background: var(--accent); border-color: var(--accent); color: var(--accent-ink);"), "icon buttons keep readable contrast on accent backgrounds");
  assert.ok(css.includes(".button-dark:hover { background: var(--accent); color: var(--accent-ink); }"), "primary CTA hover text uses the accent foreground");
  assert.ok(css.includes(".liquid-choice:hover, .liquid-choice.active { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }"), "preview controls use readable hover/active colors");
  assert.ok(html.includes('id="projectGallery" role="region" aria-label="Visual gallery of twelve software projects"'), "project gallery is a named region");
});

test("WebGL preview loads lazily near its section instead of during initial page startup", () => {
  assert.ok(js.includes("const startLiquidPreview = () => {"), "WebGL initialization is wrapped in a starter function");
  assert.ok(js.includes('{ rootMargin: "320px 0px" }'), "WebGL module waits until the preview is near the viewport");
  assert.ok(js.includes("liquidLoadObserver.disconnect();"), "WebGL initialization cannot be triggered repeatedly");
  assert.ok(js.includes("startLiquidPreview();"), "WebGL still initializes when in view or IntersectionObserver is unsupported");
});

test("AI Catalog discovery document is valid and matches the services offered", async () => {
  assert.ok(html.includes('<link rel="ai-catalog" href=".well-known/ai-catalog.json" type="application/ai-catalog+json">'), "home page should advertise the AI Catalog");
  const catalog = JSON.parse(await read(".well-known/ai-catalog.json"));
  assert.equal(catalog.specVersion, "1.0", "AI Catalog spec version should be declared");
  assert.equal(catalog.host.displayName, "Mahi / Dev", "AI Catalog host should be identified");
  assert.deepEqual(catalog.entries, [], "do not advertise AI agents or tools that this portfolio does not actually host");
});


test("journey is a normal vertical narrative and arrow navigation is page-wide only in the projects section", () => {
  assert.ok(html.includes('class="journey-timeline" aria-label="Education and software development journey"'));
  assert.ok(!html.includes('id="journeyWrap"') && !html.includes('id="journeyTrack"'), "the page should no longer pin and horizontally hijack scroll");
  assert.ok(!js.includes("const journeyWrap") && !js.includes("const journeyTrack"));
  assert.ok(js.includes("const cardWidth = viewportWidth < 420 ? 232 : viewportWidth < 760 ? 250 : 300"));
  assert.ok(js.includes("360 / Math.max(1, wheelCards.length)"));
  assert.ok(html.includes('href="https://www.hackerrank.com/certificates/153885a40705"'));
  assert.ok(html.includes('href="https://www.hackerrank.com/certificates/8e56fb1305d7"'));
  assert.ok(html.includes('href="https://www.hackerrank.com/certificates/31135fdb6019"'));
  assert.ok(html.includes('href="https://www.hackerrank.com/certificates/01694c7a5393"'));
  assert.ok(html.includes("8.20 CGPA · Graduate 2026"));
});

test("Netlify serves baseline security headers", () => {
  assert.ok(headers.includes("X-Content-Type-Options: nosniff"), "MIME sniffing should be disabled");
  assert.ok(headers.includes("X-Frame-Options: DENY"), "portfolio should not be embedded by third-party sites");
  assert.ok(headers.includes("Cross-Origin-Opener-Policy: same-origin"), "browsing context isolation should be enabled");
  assert.ok(headers.includes("Referrer-Policy: strict-origin-when-cross-origin"), "cross-origin links should not expose full path referrers");
  assert.ok(headers.includes("Permissions-Policy: camera=(), microphone=(), geolocation=()"), "unused sensitive browser capabilities should be disabled");
});

test("mobile form text, controls and compact labels remain readable", () => {
  assert.ok(css.includes(".theme-toggle, .menu-toggle { width: 44px; height: 44px; }"), "mobile navigation controls should meet a 44px tap target");
  assert.ok(css.includes(".gallery-filter { min-height: 44px; }"), "project filters should meet a 44px tap target");
  assert.ok(css.includes(".contact-form input, .contact-form textarea { font-size: 1rem; }"), "mobile form fields should avoid iOS focus zoom");
  assert.ok(css.includes(".contact-form input { min-height: 48px; }"), "mobile form fields should be comfortably tappable");
  assert.ok(css.includes(".education-item p, .cert-row > span:nth-child(3) { font-size: .78rem; }"), "mobile education details should not be tiny");
});
