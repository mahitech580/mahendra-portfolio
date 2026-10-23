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
- **Project inspection modal** with live/source links, focus handling and Escape-to-close behavior.
- **Optional OGL/WebGL liquid preview** with a normal-image fallback if the module cannot load or WebGL is unavailable.
- **Responsive capability cards, technology chips, education, certifications and internship highlights.**
- **Light/dark theme switch**, mobile navigation, custom cursor on precise pointers, and reduced-motion handling.
- **Contact form delivered through Formspree** to the recipient configured in the Formspree account.

## Tech

- Semantic HTML5
- CSS custom properties, responsive CSS Grid/Flexbox, transforms and keyframe animation
- Vanilla JavaScript (ES modules are loaded dynamically for the optional WebGL enhancement)
- OGL WebGL (enhancement only; the project preview remains usable without it)
- Boxicons and Devicon icon fonts
- GitHub Pages static hosting

## Run locally

From the repository root, serve the folder using any local HTTP server:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. A local server is needed for consistent module and asset behavior; opening `index.html` directly as a file may restrict browser modules.

## Main files

```text
mahendra-portfolio/
├── index.html
├── style.css
├── script.js
├── img/
│   ├── 1.jpg ... 6.jpg
│   ├── 630.jpeg
│   └── profile PNG
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
