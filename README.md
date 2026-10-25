# Mahi / Dev — Interactive Portfolio

Personal portfolio for **Mahendra Sai Kondaveeti (Mahi)**, a 2026 Computer Science graduate exploring software engineering, Python, AI/ML, backend development and expressive web interfaces.

**Live site:** https://mahendrasai.netlify.app/  
**GitHub Pages mirror:** https://mahitech580.github.io/mahendra-portfolio/  
**Resume:** [Mahendra_Resume_Python__.pdf](files/Mahendra_Resume_Python__.pdf)

## Experience design

The hero styling is consolidated into one responsive section rather than a stack of conflicting overrides. The `software.` accent uses a solid pink fill, so a background gradient can never render as a rectangular block behind the word.

The portfolio uses an independent monochrome editorial system: oversized typography, spacious grids, restrained motion, an interactive 3D work reel, scroll-linked storytelling, and project imagery sourced to match each build's domain. It is an independent implementation inspired by broad interaction patterns in modern creative portfolios—not a copy of another site's source.

- **Orbital preloader** with reduced-motion support.
- **Oversized editorial hero typography**, metallic gradient text, profile portrait masking, code sticker, and pointer-responsive depth.
- **Scroll progress, active navigation and reveal-on-scroll transitions.**
- **Scroll-expanding media frame** that grows as the visitor moves through the showcase.
- **Horizontal, pinned journey timeline** on desktop, with a readable stacked layout on smaller screens.
- **Interactive 3D project wheel** with mouse/touch drag, previous/next controls, keyboard support and selected-project details.
- **Image-first project atlas** with six asymmetrical editorial cards, curated online visuals, subtle hover depth, responsive layouts and one-click links into the matching project detail modal.
- **Project inspection modal** with live/source links, focus handling and Escape-to-close behavior.
- **Optional OGL/WebGL liquid preview**, loaded only when the showcase approaches the viewport, with a normal-image fallback if the module cannot load or WebGL is unavailable.
- **Online project cover imagery and a new six-card visual atlas** selected by project domain; these are illustrative third-party references, not screenshots of Mahi's actual deployments. The only personal portrait is the specified file in `img/Professional Portrait in a Modern Office.png`.
- **Responsive capability cards, technology chips, education, certifications and internship highlights.**
- **Light/dark theme switch**, mobile navigation, custom cursor on precise pointers, and reduced-motion handling.
- **Contact form delivered through Formspree** to the recipient configured in the Formspree account.
- **Machine-readable discovery:** `robots.txt`, `sitemap.xml`, `llms.txt`, and a minimal AI Catalog at `.well-known/ai-catalog.json`; the catalog is empty because this site does not host its own AI agents or tools.


## Illustrative cover-image sources

These publicly hosted illustrative references establish visual context for each project; they are not screenshots of Mahi's actual deployments.

- **Healthcare operations:** [Dribbble — Healthcare Analytics Dashboard](https://dribbble.com/shots/27228685-Healthcare-Analytics-Dashboard-Patient-Monitoring-System)
- **Travel planning:** [Dribbble — Edge Trip Planner Widget](https://dribbble.com/shots/27118900-Edge-Trip-Planner-Widget)
- **Deepfake analysis:** [EchoDefence — Deepfake Detection Technology](https://echodefence.com/insights/deepfake-detection-technology/)
- **AI coding workspace:** [Virtualization How-To — Amazon Kiro IDE](https://www.virtualizationhowto.com/2025/07/amazon-kiro-ai-ide-released-in-preview-download-it-now/)
- **Crop-yield prediction:** [OrbixHub — AI-Based Crop Yield Prediction Dashboard](https://www.orbixhub.com/)
- **Voice AI:** [FairStack — AI Voice Clone](https://fairstack.ai/tools/voice-clone)

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

GitHub Actions runs static source checks and Chromium browser tests on pushes to `main` and pull requests. Tests cover local asset references, HTML anchors, individual project repositories, image/preview matching, theme contrast, mobile navigation, project-wheel clicks and keyboard controls, modal links, image-fallback behavior, and contact-form wiring.

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
- **Space / nebula showcase:** Unsplash image CDN, `photo-1462331940025-496dfbfc7564`, used for the scroll-driven visual section under the [Unsplash License](https://unsplash.com/license).
- The personal portrait remains the exact local image specified by the site owner. Pointer movement affects only atmospheric background lighting; the portrait never translates or scales.
