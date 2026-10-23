# Mahi / Dev — Interactive Portfolio

Personal portfolio for **Mahendra Sai Kondaveeti (Mahi)**, a 2026 Computer Science graduate exploring software engineering, Python, AI/ML, backend development and expressive web interfaces.

**Live site:** https://mahitech580.github.io/mahendra-portfolio/  
**Resume:** [Mahendra_Resume_Python__.pdf](files/Mahendra_Resume_Python__.pdf)

## Experience design

The portfolio combines an editorial, monochrome visual system with cyan accents and original interaction code. It is an independent implementation inspired by broad interaction patterns in modern creative portfolios—not a copy of another site's source.

- **Orbital preloader** with reduced-motion support.
- **Oversized editorial hero typography**, metallic gradient text, profile portrait masking, code sticker, and pointer-responsive depth.
- **Scroll progress, active navigation and reveal-on-scroll transitions.**
- **Scroll-expanding media frame** that grows as the visitor moves through the showcase.
- **Horizontal, pinned journey timeline** on desktop, with a readable stacked layout on smaller screens.
- **Interactive 3D project wheel** with mouse/touch drag, previous/next controls, keyboard support and selected-project details.
- **Image-first project atlas** with six asymmetrical editorial cards, curated online visuals, subtle hover depth, responsive layouts and one-click links into the matching project detail modal.
- **Project inspection modal** with live/source links, focus handling and Escape-to-close behavior.
- **Optional OGL/WebGL liquid preview** with a normal-image fallback if the module cannot load or WebGL is unavailable.
- **Online project cover imagery and a new six-card visual atlas** selected by project domain; these are illustrative third-party references, not screenshots of Mahi's actual deployments. The only personal portrait is the specified file in `img/Professional Portrait in a Modern Office.png`.
- **Responsive capability cards, technology chips, education, certifications and internship highlights.**
- **Light/dark theme switch**, mobile navigation, custom cursor on precise pointers, and reduced-motion handling.
- **Contact form delivered through Formspree** to the recipient configured in the Formspree account.


## Illustrative cover-image sources

The six project cards use illustrative references from third-party sites for atmosphere and category context; they are not screenshots captured from Mahi's actual deployments.

- **Healthcare operations cover:** [AgileDigest — Healthcare Operations](https://agiledigest.com/industries/healthcare)
- **Travel planning cover:** [AI Travelfika — AI Insights for Philippine Travel](https://ai.travelfika.com/blogs/ai-insights-for-philippine-travel)
- **Deepfake-analysis cover:** [Deepfake Detection dashboard visual](https://deepfakedetection.site/)
- **AI coding-workspace cover:** [Virtualization How-To — Amazon Kiro AI IDE](https://www.virtualizationhowto.com/2025/07/amazon-kiro-ai-ide-released-in-preview-download-it-now/)
- **Crop-yield cover:** [B-AGRO — Precision Agriculture](https://b-agro.az/)
- **Voice AI cover:** [Vivago — AI voice waveform visual](https://vivago.ai/effects/video/55494ec7-3c31-46e0-b4cb-464091b9e83b)

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
