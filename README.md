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
- **Online project cover imagery** selected by project theme; covers are illustrative references, not claims that third-party screenshots are the exact deployed application.
- **Responsive capability cards, technology chips, education, certifications and internship highlights.**
- **Light/dark theme switch**, mobile navigation, custom cursor on precise pointers, and reduced-motion handling.
- **Contact form delivered through Formspree** to the recipient configured in the Formspree account.


## Illustrative cover-image sources

The six project cards use online cover visuals for atmosphere and category context. They are not presented as screenshots captured from Mahi's actual deployments.

- **Healthcare workspace cover:** [Dribbble — Healthcare Analytics Dashboard](https://dribbble.com/shots/27228685-Healthcare-Analytics-Dashboard-Patient-Monitoring-System)
- **Travel planning cover:** [Dribbble — AI Trip Planner Dashboard](https://dribbble.com/shots/26442798--Product-design-for-the-AI-Trip-Planner-Hyperactive)
- **Deepfake analysis cover:** [EchoDefence — Deepfake Detection Technology](https://echodefence.com/insights/deepfake-detection-technology/)
- **AI coding assistant cover:** [Virtualization How-To — Amazon Kiro AI IDE](https://www.virtualizationhowto.com/2025/07/amazon-kiro-ai-ide-released-in-preview-download-it-now/)
- **Crop-yield cover:** [Unsplash-hosted agricultural landscape image](https://images.unsplash.com/photo-1500382017468-9049fed747ef)
- **Voice AI cover:** [FairStack — AI Voice Clone](https://fairstack.ai/tools/voice-clone)

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
