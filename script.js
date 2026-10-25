/* MAHI / DEV interactions
   Native JavaScript first; optional OGL WebGL enhances the liquid preview.
*/
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Remote image hosts can rate-limit or remove files. Preserve the layout and
  // display intentional visual fallbacks; successful replacement images restore it.
  const markImageFallback = image => {
    image.classList.add("image-unavailable");
    [image.closest(".wheel-card"), image.closest(".expand-frame"),
      image.closest(".liquid-showcase"), image.closest(".portrait-wrap"), image.closest(".project-gallery-card")]
      .filter(Boolean)
      .forEach(container => container.classList.add("image-failed"));
  };
  const clearImageFallback = image => {
    image.classList.remove("image-unavailable");
    [image.closest(".wheel-card"), image.closest(".expand-frame"),
      image.closest(".liquid-showcase"), image.closest(".portrait-wrap"), image.closest(".project-gallery-card")]
      .filter(Boolean)
      .forEach(container => {
        if (!container.querySelector("img.image-unavailable")) container.classList.remove("image-failed");
      });
  };
  // Netlify Image CDN is only available on Netlify-hosted URLs. On local
  // preview and GitHub Pages, use the original local portrait directly.
  if (!window.location.hostname.endsWith(".netlify.app")) {
    $$("picture.hero-portrait-picture source").forEach(source => {
      const image = source.closest("picture")?.querySelector("img");
      source.remove();
      if (image) image.src = image.getAttribute("src") || image.src;
    });
  }

  $$("img").forEach(image => {
    image.addEventListener("error", () => {
      // Netlify Image CDN sources are used in production, while local preview
      // and GitHub Pages should fall back to the original local image.
      const picture = image.closest("picture");
      const source = picture?.querySelector("source");
      if (source && image.currentSrc && image.currentSrc !== image.src && !image.dataset.sourceFallbackAttempted) {
        image.dataset.sourceFallbackAttempted = "true";
        source.remove();
        image.removeAttribute("srcset");
        return;
      }
      markImageFallback(image);
    });
    image.addEventListener("load", () => clearImageFallback(image));
    if (image.complete && image.naturalWidth === 0 && image.currentSrc) markImageFallback(image);
  });

  const preloader = $("#preloader");
  window.addEventListener("load", () => {
    window.setTimeout(() => preloader?.classList.add("is-done"), reducedMotion ? 0 : 250);
  }, { once: true });
  window.setTimeout(() => preloader?.classList.add("is-done"), reducedMotion ? 0 : 1000);

  // Reveal elements only after the observer is ready; no-JS browsing stays readable.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    document.body.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item, index) => {
      if (index % 7 === 1) item.dataset.revealDelay = "1";
      if (index % 7 === 3) item.dataset.revealDelay = "2";
      if (index % 7 === 5) item.dataset.revealDelay = "3";
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  // Theme switch: remember a visitor's preference, but default to the editorial light theme.
  const themeToggle = $("#themeToggle");
  const savedTheme = (() => {
    try { return localStorage.getItem("mahi-portfolio-theme"); } catch { return null; }
  })();
  if (savedTheme === "dark" || savedTheme === "light") document.documentElement.dataset.theme = savedTheme;
  const paintThemeButton = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    if (!themeToggle) return;
    themeToggle.innerHTML = isDark ? '<i class="bx bx-sun"></i>' : '<i class="bx bx-moon"></i>';
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
  };
  paintThemeButton();
  themeToggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("mahi-portfolio-theme", next); } catch {}
    paintThemeButton();
  });

  // Mobile navigation.
  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");
  const closeNav = () => {
    mainNav?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    if (menuToggle) menuToggle.innerHTML = '<i class="bx bx-menu"></i>';
    menuToggle?.setAttribute("aria-label", "Open navigation");
  };
  menuToggle?.addEventListener("click", () => {
    const willOpen = !mainNav?.classList.contains("is-open");
    mainNav?.classList.toggle("is-open", willOpen);
    menuToggle.setAttribute("aria-expanded", String(willOpen));
    menuToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    menuToggle.innerHTML = willOpen ? '<i class="bx bx-x"></i>' : '<i class="bx bx-menu"></i>';
  });
  $$("#mainNav a").forEach(link => link.addEventListener("click", closeNav));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeNav();
    updateWheelRadius();
  }, { passive: true });

  // Scroll-linked details: progress, active navigation, expanding image, and pinned horizontal journey.
  const header = $("#siteHeader");
  const progressBar = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const expandFrame = $("#expandFrame");
  const journeyWrap = $("#journeyWrap");
  const journeyTrack = $("#journeyTrack");
  const journeyProgress = $("#journeyProgress");
  const journeyProgressLabel = $("#journeyProgressLabel");
  const navLinks = $$("#mainNav a");
  const navTargets = navLinks.map(link => $(link.getAttribute("href"))).filter(Boolean);
  let scrollTicking = false;

  function updateScrollEffects() {
    const scrollY = window.scrollY || 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (scrollable > 0 ? scrollY / scrollable * 100 : 0) + "%";
    document.documentElement.style.setProperty("--scroll-drift", -Math.min(scrollY * 0.075, 100) + "px");
    document.documentElement.style.setProperty("--scroll-progress", String(scrollable > 0 ? scrollY / scrollable : 0));
    header?.classList.toggle("is-scrolled", scrollY > 18);

    let activeId = "home";
    navTargets.forEach(section => {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.48) activeId = section.id;
    });
    navLinks.forEach(link => {
      const isActive = link.getAttribute("href") === "#" + activeId;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    backToTop?.classList.toggle("is-visible", scrollY > 620);

    if (expandFrame && !reducedMotion) {
      const rect = expandFrame.closest(".expand-zone")?.getBoundingClientRect();
      if (rect) {
        const maxScroll = Math.max(1, rect.height - window.innerHeight);
        const t = clamp(-rect.top / maxScroll);
        const eased = 1 - Math.pow(1 - t, 2.2);
        const scale = 0.72 + eased * 0.28;
        expandFrame.style.transform = "scale(" + scale.toFixed(3) + ")";
        expandFrame.style.borderRadius = (7 * (1 - eased)) + "px";
      }
    }

    if (journeyWrap && journeyTrack && window.innerWidth > 760 && !reducedMotion) {
      const rect = journeyWrap.getBoundingClientRect();
      const distance = Math.max(1, journeyWrap.offsetHeight - window.innerHeight);
      const t = clamp(-rect.top / distance);
      const maxX = Math.max(0, journeyTrack.scrollWidth - window.innerWidth);
      journeyTrack.style.transform = "translate3d(" + (-maxX * t).toFixed(1) + "px,0,0)";
      if (journeyProgress) journeyProgress.style.width = (t * 100).toFixed(1) + "%";
      if (journeyProgressLabel) journeyProgressLabel.textContent = String(Math.min(3, Math.floor(t * 3) + 1)).padStart(2, "0") + " / 03";
    }
    scrollTicking = false;
  }
  const requestScrollUpdate = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  };
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScrollEffects();
  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });

  // Keep the personal portrait anchored; cursor motion belongs to the background light, not the person.

  // Optional custom cursor on precision pointers. Native cursors remain for touch/accessibility.
  const ring = $("#cursorRing");
  const dot = $("#cursorDot");
  if (ring && dot && !reducedMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.body.classList.add("cursor-ready");
    let mouseX = -50, mouseY = -50, ringX = -50, ringY = -50;
    window.addEventListener("pointermove", event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
    }, { passive: true });
    const followCursor = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      ring.style.left = ringX + "px";
      ring.style.top = ringY + "px";
      window.requestAnimationFrame(followCursor);
    };
    followCursor();
    $$("a,button,[role='button']").forEach(el => {
      el.addEventListener("pointerenter", () => ring.classList.add("is-active"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
    });
  }

  // Project wheel: 6-face CSS 3D cylinder with keyboard, buttons, pointer-drag and click selection.
  const wheelViewport = $("#wheelViewport");
  const projectWheel = $("#projectWheel");
  const wheelCards = $$(".wheel-card", projectWheel || document);
  const prevButton = $("#wheelPrev");
  const nextButton = $("#wheelNext");
  const workIndex = $("#workIndex");
  const selectedTitle = $("#selectedProjectTitle");
  const selectedDescription = $("#selectedProjectDescription");
  const selectedStack = $("#selectedProjectStack");
  const openDetailButton = $("#openProjectDetail");
  let selectedIndex = 0;
  let dragStartX = null;
  let dragPointerId = null;
  let dragTarget = null;
  let dragDeltaX = 0;
  let wasDragging = false;
  let suppressNextWheelClick = false;

  function updateWheelRadius() {
    if (!projectWheel || !wheelCards.length) return;
    const viewportWidth = wheelViewport?.clientWidth || window.innerWidth;
    const radius = viewportWidth < 420 ? 238 : viewportWidth < 760 ? 265 : viewportWidth < 1100 ? 310 : 345;
    wheelCards.forEach((card, index) => {
      card.style.transform = "translate(-50%,-50%) rotateY(" + (index * 60) + "deg) translateZ(" + radius + "px)";
    });
    renderWheel();
  }
  function renderWheel() {
    if (!projectWheel || !wheelCards.length) return;
    projectWheel.style.transform = "translate(-50%,-50%) rotateY(" + (-selectedIndex * 60) + "deg)";
    wheelCards.forEach((card, index) => {
      const isActive = index === selectedIndex;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-pressed", String(isActive));
      card.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    if (workIndex) workIndex.textContent = String(selectedIndex + 1).padStart(2, "0");
    const active = wheelCards[selectedIndex];
    if (active) {
      if (selectedTitle) selectedTitle.textContent = active.dataset.title || "Selected project";
      if (selectedDescription) selectedDescription.textContent = active.dataset.description || "";
      if (selectedStack) {
        selectedStack.replaceChildren();
        (active.dataset.stack || "").split("·").map(s => s.trim()).filter(Boolean).forEach(label => {
          const span = document.createElement("span");
          span.textContent = label;
          selectedStack.append(span);
        });
      }
      const previewChoice = $(".liquid-choice[data-image='" + (active.querySelector("img")?.getAttribute("src") || "") + "']");
      if (previewChoice && !previewChoice.classList.contains("active")) chooseLiquidImage(previewChoice);
    }
  }
  function selectWheelItem(index, open = false) {
    if (!wheelCards.length) return;
    selectedIndex = (index + wheelCards.length) % wheelCards.length;
    renderWheel();
    if (open) openProjectModal(wheelCards[selectedIndex]);
  }
  prevButton?.addEventListener("click", () => selectWheelItem(selectedIndex - 1));
  nextButton?.addEventListener("click", () => selectWheelItem(selectedIndex + 1));
  wheelCards.forEach((card, index) => {
    card.addEventListener("click", event => {
      if (wasDragging || suppressNextWheelClick) {
        event.preventDefault();
        wasDragging = false;
        suppressNextWheelClick = false;
        return;
      }
      selectWheelItem(index, true);
    });
  });
  wheelViewport?.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); selectWheelItem(selectedIndex + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); selectWheelItem(selectedIndex - 1); }
    if (event.key === "Enter" || event.key === " ") {
      const active = wheelCards[selectedIndex];
      if (active) { event.preventDefault(); openProjectModal(active); }
    }
  });
  wheelViewport?.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX = event.clientX;
    dragPointerId = event.pointerId;
    dragDeltaX = 0;
    wasDragging = false;
    wheelViewport.classList.add("is-dragging");
    dragTarget = event.target.closest?.(".wheel-card") || wheelViewport;
  });
  // Observe movement on window, not only on the 3D card under the pointer.
  // Rotating/transformed cards can change the event target during a drag.
  window.addEventListener("pointermove", event => {
    if (dragStartX === null || event.pointerId !== dragPointerId) return;
    dragDeltaX = event.clientX - dragStartX;
    if (Math.abs(dragDeltaX) > 8) wasDragging = true;
  }, { passive: true });
  const finishWheelDrag = event => {
    if (dragStartX === null || (event && event.pointerId !== dragPointerId)) return;
    // Use the release coordinate as a final source of truth in case a browser
    // suppresses one or more pointermove events during an image/card drag.
    const finalDelta = event && Number.isFinite(event.clientX) ? event.clientX - dragStartX : dragDeltaX;
    dragDeltaX = finalDelta;
    const didDrag = Math.abs(finalDelta) > 28;
    if (didDrag) selectWheelItem(selectedIndex - Math.round(finalDelta / 95));
    wheelViewport?.classList.remove("is-dragging");
    dragStartX = null;
    dragPointerId = null;
    dragTarget = null;
    if (didDrag || wasDragging) {
      wasDragging = true;
      suppressNextWheelClick = true;
      // Give the pointer-generated click one task to arrive, then clear the
      // guard so a later intentional click is never swallowed.
      window.setTimeout(() => {
        wasDragging = false;
        suppressNextWheelClick = false;
      }, 250);
    }
  };
  window.addEventListener("pointerup", finishWheelDrag);
  window.addEventListener("pointercancel", finishWheelDrag);
  updateWheelRadius();

  // Map the visual case files to the same source of truth as the 3D wheel.
  const galleryCards = $$(".project-gallery-card");
  const galleryFilters = $$(".gallery-filter");
  const galleryResultCount = $("#galleryResultCount");
  const applyGalleryFilter = filter => {
    let visibleCount = 0;
    galleryCards.forEach(card => {
      const isVisible = filter === "all" || card.dataset.filterCategory === filter;
      card.hidden = !isVisible;
      if (isVisible) visibleCount++;
    });
    galleryFilters.forEach(button => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (galleryResultCount) {
      galleryResultCount.textContent = "SHOWING " + String(visibleCount).padStart(2, "0") + " / 06 BUILDS";
    }
    const gallery = $("#projectGallery");
    if (gallery) {
      const label = filter === "all" ? "all software projects" : filter === "product" ? "web and product projects" : filter === "ai" ? "AI and machine-learning projects" : "generative AI and developer-tool projects";
      gallery.setAttribute("aria-label", "Showing " + visibleCount + " of 6 projects: " + label);
    }
  };
  galleryFilters.forEach(button => {
    button.addEventListener("click", () => applyGalleryFilter(button.dataset.filter || "all"));
  });

  galleryCards.forEach(card => {
    card.addEventListener("click", () => {
      const index = Number.parseInt(card.dataset.projectIndex, 10);
      if (Number.isInteger(index) && index >= 0 && index < wheelCards.length) selectWheelItem(index, true);
    });
  });
  if (galleryCards.length && !reducedMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    galleryCards.forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = clamp((event.clientX - rect.left) / rect.width);
        const y = clamp((event.clientY - rect.top) / rect.height);
        card.style.setProperty("--tilt-x", ((x - .5) * 2.8).toFixed(2) + "deg");
        card.style.setProperty("--tilt-y", ((.5 - y) * 2.8).toFixed(2) + "deg");
      }, { passive: true });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  // Project modal uses the same project metadata as the wheel so details stay in sync.
  const projectModal = $("#projectModal");
  const modalClose = $("#modalClose");
  const modalTitle = $("#modalTitle");
  const modalCategory = $("#modalCategory");
  const modalDescription = $("#modalDescription");
  const modalStack = $("#modalStack");
  const modalLinks = $("#modalLinks");
  let previouslyFocused = null;
  function openProjectModal(card) {
    if (!projectModal || !card) return;
    previouslyFocused = document.activeElement;
    if (modalTitle) modalTitle.textContent = card.dataset.title || "Project";
    if (modalCategory) modalCategory.textContent = card.dataset.category || "PROJECT / DETAIL";
    if (modalDescription) modalDescription.textContent = card.dataset.description || "";
    if (modalStack) {
      modalStack.replaceChildren();
      (card.dataset.stack || "").split("·").map(s => s.trim()).filter(Boolean).forEach(label => {
        const span = document.createElement("span");
        span.textContent = label;
        modalStack.append(span);
      });
    }
    if (modalLinks) {
      modalLinks.replaceChildren();
      const links = [
        { url: card.dataset.live, label: "Open live project", icon: "bx-up-right-arrow-alt" },
        { url: card.dataset.source, label: "View repository source", icon: "bxl-github" }
      ].filter(link => link.url && /^https:\/\//.test(link.url));
      links.forEach(link => {
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = link.label;
        const icon = document.createElement("i");
        icon.className = "bx " + link.icon;
        icon.setAttribute("aria-hidden", "true");
        a.append(icon);
        modalLinks.append(a);
      });
      if (!links.length) {
        const a = document.createElement("a");
        a.href = "https://github.com/mahitech580";
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = "Explore GitHub";
        modalLinks.append(a);
      }
    }
    projectModal.classList.add("is-open");
    projectModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // The card's default click action may restore focus after this handler.
    // Re-apply focus after the event and opening transition have started.
    const focusCloseButton = () => {
      if (projectModal.classList.contains("is-open")) modalClose?.focus({ preventScroll: true });
    };
    window.requestAnimationFrame(focusCloseButton);
    window.setTimeout(focusCloseButton, 60);
    // Re-assert focus after the overlay has completed its opening transition,
    // in case the initiating card's default action or animation steals it.
    projectModal.addEventListener("transitionend", event => {
      if (event.target === projectModal && event.propertyName === "opacity") focusCloseButton();
    }, { once: true });
  }
  function closeProjectModal() {
    if (!projectModal?.classList.contains("is-open")) return;
    projectModal.classList.remove("is-open");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    previouslyFocused?.focus?.();
  }
  modalClose?.addEventListener("click", closeProjectModal);
  $$("[data-close-modal]", projectModal || document).forEach(el => el.addEventListener("click", closeProjectModal));
  openDetailButton?.addEventListener("click", () => openProjectModal(wheelCards[selectedIndex]));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProjectModal();
    if (!projectModal?.classList.contains("is-open") || event.key !== "Tab") return;
    const focusables = $$("button,a[href],[tabindex='0']", projectModal).filter(el => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Liquid preview: native image fallback remains visible if WebGL/CDN is unavailable.
  const liquidShowcase = $("#liquidShowcase");
  const liquidCanvas = $("#liquidCanvas");
  const liquidFallback = $("#liquidFallback");
  const liquidLabel = $("#liquidLabel");
  const liquidChoices = $$(".liquid-choice");
  let changeLiquidImage = null;
  function chooseLiquidImage(button) {
    const imagePath = button?.dataset.image;
    if (!imagePath) return;
    liquidChoices.forEach(choice => choice.classList.toggle("active", choice === button));
    if (liquidFallback && liquidFallback.getAttribute("src") !== imagePath) liquidFallback.src = imagePath;
    if (liquidLabel) liquidLabel.textContent = button.dataset.label || "PROJECT PREVIEW";
    if (changeLiquidImage) changeLiquidImage(imagePath);
  }
  liquidChoices.forEach(button => button.addEventListener("click", () => {
    chooseLiquidImage(button);
    const linkedIndex = wheelCards.findIndex(card => card.querySelector("img")?.getAttribute("src") === button.dataset.image);
    if (linkedIndex >= 0 && linkedIndex !== selectedIndex) {
      selectedIndex = linkedIndex;
      renderWheel();
    }
  }));

  if (liquidCanvas && liquidShowcase && !reducedMotion) {
    let liquidPreviewStarted = false;
    const startLiquidPreview = () => {
      if (liquidPreviewStarted) return;
      liquidPreviewStarted = true;
    import("https://cdn.jsdelivr.net/npm/ogl@1.0.11/dist/ogl.mjs").then(({ Renderer, Program, Mesh, Triangle, Texture, Vec2 }) => {
      const renderer = new Renderer({ canvas: liquidCanvas, alpha: false, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
      const gl = renderer.gl;
      gl.clearColor(0.035, 0.045, 0.04, 1);
      const texture = new Texture(gl, { generateMipmaps: false });
      texture.minFilter = gl.LINEAR;
      texture.magFilter = gl.LINEAR;
      const uniforms = {
        tMap: { value: texture },
        uMouse: { value: new Vec2(.5, .5) },
        uResolution: { value: new Vec2(1, 1) },
        uImageResolution: { value: new Vec2(1, 1) },
        uTime: { value: 0 },
        uHover: { value: 0 }
      };
      const program = new Program(gl, {
        vertex: `
          attribute vec2 uv;
          attribute vec3 position;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragment: `
          precision highp float;
          uniform sampler2D tMap;
          uniform vec2 uMouse;
          uniform vec2 uResolution;
          uniform vec2 uImageResolution;
          uniform float uTime;
          uniform float uHover;
          varying vec2 vUv;
          void main() {
            float canvasAspect = uResolution.x / max(1.0, uResolution.y);
            float imageAspect = uImageResolution.x / max(1.0, uImageResolution.y);
            vec2 uv = vUv;
            if (canvasAspect > imageAspect) {
              uv.y = (uv.y - 0.5) * (imageAspect / canvasAspect) + 0.5;
            } else {
              uv.x = (uv.x - 0.5) * (canvasAspect / imageAspect) + 0.5;
            }
            vec2 delta = uv - uMouse;
            float dist = length(delta);
            float ripple = sin(dist * 38.0 - uTime * 2.8) * exp(-dist * 11.0) * 0.022 * uHover;
            vec2 dir = delta / max(dist, 0.001);
            vec2 bent = uv + dir * ripple;
            float split = exp(-dist * 9.0) * 0.0035 * uHover;
            vec4 color;
            color.r = texture2D(tMap, bent + vec2(split, 0.0)).r;
            color.g = texture2D(tMap, bent).g;
            color.b = texture2D(tMap, bent - vec2(split, 0.0)).b;
            color.a = 1.0;
            gl_FragColor = color;
          }
        `,
        uniforms
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      const resizeRenderer = () => {
        const rect = liquidShowcase.getBoundingClientRect();
        const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
        renderer.setSize(width, height);
        uniforms.uResolution.value.set(width, height);
      };
      let imageRequest = 0;
      const loadTexture = path => {
        const ticket = ++imageRequest;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          if (ticket !== imageRequest) return;
          texture.image = image;
          uniforms.uImageResolution.value.set(image.naturalWidth || 1, image.naturalHeight || 1);
          liquidShowcase.classList.add("webgl-ready");
        };
        image.onerror = () => liquidShowcase.classList.remove("webgl-ready");
        image.src = path;
      };
      changeLiquidImage = loadTexture;
      loadTexture(liquidFallback?.getAttribute("src") || "https://cdn.dribbble.com/userupload/47214616/file/d2f301ad8d0b7b873750944d54a86394.png");
      resizeRenderer();
      const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resizeRenderer) : null;
      resizeObserver?.observe(liquidShowcase);
      window.addEventListener("resize", resizeRenderer, { passive: true });

      let pointerX = .5, pointerY = .5, hovering = false;
      liquidShowcase.addEventListener("pointermove", event => {
        const rect = liquidShowcase.getBoundingClientRect();
        pointerX = clamp((event.clientX - rect.left) / rect.width);
        pointerY = 1 - clamp((event.clientY - rect.top) / rect.height);
        uniforms.uMouse.value.set(pointerX, pointerY);
        hovering = true;
      }, { passive: true });
      liquidShowcase.addEventListener("pointerenter", () => { hovering = true; });
      liquidShowcase.addEventListener("pointerleave", () => { hovering = false; });
      const start = performance.now();
      let visible = true;
      if ("IntersectionObserver" in window) {
        const liquidObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: .01 });
        liquidObserver.observe(liquidShowcase);
      }
      const render = now => {
        if (!document.hidden && visible) {
          uniforms.uTime.value = (now - start) / 1000;
          uniforms.uHover.value += ((hovering ? 1 : 0) - uniforms.uHover.value) * .08;
          renderer.render({ scene: mesh });
        }
        window.requestAnimationFrame(render);
      };
      window.requestAnimationFrame(render);
    }).catch(() => {
      // The standard image preview is the intentional no-WebGL fallback.
      liquidShowcase.classList.remove("webgl-ready");
    });
    };
    if ("IntersectionObserver" in window) {
      const liquidLoadObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          liquidLoadObserver.disconnect();
          startLiquidPreview();
        }
      }, { rootMargin: "320px 0px" });
      liquidLoadObserver.observe(liquidShowcase);
    } else {
      startLiquidPreview();
    }
  }

  // Pointer light gently tracks the visitor; this is RAF-throttled and disabled for reduced-motion users.
  if (!reducedMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    let pointerFrame = 0;
    let latestPointer = null;
    window.addEventListener("pointermove", event => {
      latestPointer = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        if (latestPointer) {
          document.documentElement.style.setProperty("--pointer-x", latestPointer.x + "px");
          document.documentElement.style.setProperty("--pointer-y", latestPointer.y + "px");
        }
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  // Current year, and a tiny progressive enhancement marker for the loaded page.
  const year = $("#currentYear");
  if (year) year.textContent = String(new Date().getFullYear());
})();
