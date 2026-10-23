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
  assert.ok(css.includes(".journey-section :focus-visible,\\n.work-section :focus-visible,\\n.contact-section :focus-visible { outline-color: var(--accent); }"), "dark sections need a high-contrast focus ring");
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
