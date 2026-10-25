# Mahi / Dev — Interactive Portfolio

Personal portfolio for **Mahendra Sai Kondaveeti (Mahi)**, a 2026 Computer Science graduate exploring software engineering, Python, AI/ML, backend development and expressive web interfaces.

**Live site:** https://mahendrasai.netlify.app/  
**GitHub Pages mirror:** https://mahitech580.github.io/mahendra-portfolio/  
**Resume:** [Mahendra_Resume_Python__.pdf](files/Mahendra_Resume_Python__.pdf)

## Experience design

The hero styling is consolidated into one responsive section rather than a stack of conflicting overrides. The `software.` accent uses a solid pink fill, so a background gradient can never render as a rectangular block behind the word.

The portfolio uses an independent monochrome editorial system: oversized typography, spacious grids, restrained motion, an interactive 3D work reel, scroll-linked storytelling, and project imagery sourced to match each build's domain. It is an independent implementation inspired by broad interaction patterns in modern creative portfolios—not a copy of another site's source.

- **Orbital preloader** with reduced-motion support.
- **Oversized editorial hero typography**, metallic gradient text, profile portrait masking, and pointer-responsive depth.
- **Scroll progress, active navigation and reveal-on-scroll transitions.**
- **Scroll-expanding media frame** that grows as the visitor moves through the showcase.
- **Scroll-friendly vertical journey timeline** covering the 2022–2026 CSE degree, applied AI/ML project work, full-stack product builds, and current entry-level role goals.
- **Interactive 3D project wheel** with manual previous/next controls, pointer drag, ← / → navigation while the Projects section is visible, wrapping selection, and selected-project details.
- **Image-first project atlas** with twelve editorial project cards, category filters for product, AI/ML, GenAI and data/SQL, topic-matched artwork, responsive layouts and one-click links into the matching project detail modal.
- **Project inspection modal** with live/source links, focus handling and Escape-to-close behavior.
- **Optional OGL/WebGL liquid preview**, loaded only when the showcase approaches the viewport, with a normal-image fallback if the module cannot load or WebGL is unavailable.
- **Twelve topic-matched project covers** spanning healthcare, travel, computer vision, AI coding, agriculture, voice AI, inventory, analytics, cinema, banking, logistics and resume tooling. Every cover offers responsive Unsplash variants up to **3840px wide (4K)** so the browser can select an appropriate size for the screen and pixel density. Covers are illustrative photos, not screenshots of Mahi's actual deployments. The only personal portrait is the specified file in `img/Professional Portrait in a Modern Office.png`.
- **Responsive capability cards, technology chips, education, certifications and internship highlights.**
- **Light/dark theme switch**, mobile navigation, custom cursor on precise pointers, and reduced-motion handling.
- **Contact form delivered through Formspree** to the recipient configured in the Formspree account.
- **Machine-readable discovery:** `robots.txt`, `sitemap.xml`, `llms.txt`, and a minimal AI Catalog at `.well-known/ai-catalog.json`; the catalog is empty because this site does not host its own AI agents or tools.
- **Netlify response headers:** baseline MIME-sniffing, clickjacking, referrer, opener-isolation, and browser-permissions protections are configured in `_headers`.


## Project archive

The 12 cards link to their matching public repositories. Live links are only shown for projects with a configured demo URL; projects without a demo link open the source repository.

1. **AVERIS** — simulated healthcare-operations product UI.
2. **TripPilot** — responsive travel planning experience.
3. **Deepfake Video Detection** — CNN and frequency-domain media analysis.
4. **NodeAI Studio** — AI-assisted developer workspace.
5. **Crop Yield Prediction** — agricultural prediction and recommendation workflow.
6. **VoxGenAI** — local voice assistant using speech recognition and a locally run model.
7. **StockFlow** — organization-scoped inventory SaaS MVP.
8. **DataVision Intelligence** — data profiling, quality checks and model workflows.
9. **CINEPLAY** — regional and genre-aware AI movie discovery.
10. **Banking & Financial Transaction Management** — synthetic-data MySQL/REST analytics system.
11. **LastMileIQ SQL** — PostgreSQL delivery and route analytics.
12. **AI Resume Analyzer** — document extraction and job-description skill matching.

These are illustrative references, not screenshots from Mahi's actual deployments. Cover images use topic-related photos from [Unsplash](https://unsplash.com/license) to establish visual context.

## Tech

- Semantic HTML5
- CSS custom properties, responsive CSS Grid/Flexbox, transforms and keyframe animation
- Vanilla JavaScript (ES modules are loaded dynamically for the optional WebGL enhancement)
- OGL WebGL (enhancement only; the project preview remains usable without it)
- Boxicons and Devicon icon fonts
- GitHub Pages static hosting

## Run locally

Install the development test dependency and run the checks:

```bash
npm install
npm run test:static
npx playwright install chromium
npm run test:e2e
```

For local browsing, serve the root folder:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. A local server is needed for consistent module and asset behavior; opening `index.html` directly as a file may restrict browser modules.

## Quality checks

GitHub Actions runs static source checks and Chromium browser tests on pushes to `main` and pull requests. Tests cover local assets and anchors, all 12 repository mappings and gallery images, project filtering, left/right arrow navigation and wraparound, the vertical journey, HackerRank links, theme contrast, mobile layout, modal behavior, image fallback, and contact-form wiring.

The portfolio remains a static GitHub Pages site; Node.js and Playwright are development-only test tools and are not needed by visitors.

## Main files

```text
mahendra-portfolio/
├── .github/workflows/portfolio-checks.yml
├── index.html
├── style.css
├── script.js
├── package.json
├── playwright.config.mjs
├── tests/
│   ├── portfolio.static.test.mjs
│   └── e2e/portfolio.spec.mjs
├── img/
│   └── Professional Portrait in a Modern Office.png  # personal portrait only
└── files/
    └── Mahendra_Resume_Python__.pdf
```

## Backup

The portfolio source from before the interactive redesign is preserved on branch:

`backup/original-portfolio-2026-10-23`

That branch contains the original `index.html`, `style.css`, and `script.js` as well as the assets and resume that were present when the backup was created.

## Contact

- Email: mahitech580@gmail.com
- GitHub: https://github.com/mahitech580
- LinkedIn: https://www.linkedin.com/in/mahendra-sai-kondaveeti-93438b279/


## Visual background attribution

- **Coding workspace:** Unsplash image CDN, `photo-1498050108023-c5249f4df085`, used as a software-development background under the [Unsplash License](https://unsplash.com/license).
- **AI / ML atmosphere:** Unsplash image CDN, `photo-1677442136019-21780ecad995`, used to evoke AI and neural-network exploration under the [Unsplash License](https://unsplash.com/license).
- **Scroll-driven space/coding visual:** a custom local SVG illustration at `img/coding-among-the-stars.svg`, composed for this portfolio. It is a stylized visual rather than a screenshot of a deployed project.
- The personal portrait remains the exact local image specified by the site owner. Pointer movement affects only atmospheric background lighting; the portrait never translates or scales.
