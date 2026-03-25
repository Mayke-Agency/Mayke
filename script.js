/* =========================================================
   MAYKE — script.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  const header = document.querySelector("[data-header]") || document.querySelector(".site-header");
  const hero = document.querySelector("[data-hero]") || document.querySelector(".hero");
  const about = document.getElementById("about");
  const burger = document.querySelector("[data-burger]") || document.querySelector(".nav-toggle");
  const nav = document.querySelector("[data-nav]") || document.querySelector(".site-nav");

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  /* =========================================================
     GLOBAL HELPERS
     ========================================================= */

  function setBodyReady() {
    body.classList.add("is-ready");
    body.classList.remove("is-entering");
  }

  function setHomeReady() {
    body.classList.add("home-ready");
  }

  function clearHomeReady() {
    body.classList.remove("home-ready");
  }

  function getHeaderOffset() {
    const headerEl = document.querySelector(".site-header");
    return headerEl ? headerEl.offsetHeight : 0;
  }

  /* =========================================================
     YEAR
     ========================================================= */

  function initYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* =========================================================
     HEADER
     Keeps your original about-based visibility logic,
     plus solid background state after scrolling.
     ========================================================= */

  function initHeader() {
    if (!header) return;

    if (!about) {
      header.classList.remove("is-hidden");
      if (window.scrollY > 24) header.classList.add("is-solid");
      return;
    }

    const setHeaderVisible = (visible) => {
      header.classList.toggle("is-hidden", !visible);
    };

    const updateSolidState = () => {
      header.classList.toggle("is-solid", window.scrollY > 24);
    };

    if (window.scrollY < 30) setHeaderVisible(false);
    updateSolidState();

    const navIO = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeaderVisible(entry.isIntersecting);
      },
      { threshold: 0.01, rootMargin: "-15% 0px -70% 0px" }
    );

    navIO.observe(about);

    window.addEventListener("scroll", updateSolidState, { passive: true });
    window.addEventListener("pageshow", updateSolidState);
  }

  /* =========================================================
     HERO MEDIA STABILIZATION
     New: still image is the first state, video only fades in
     when ready, and back navigation re-inits cleanly.
     ========================================================= */

  function initHeroMedia() {
  if (!hero) return;

  const heroMedia = hero.querySelector(".hero-media");
  const video = hero.querySelector(".hero-video");

  if (!heroMedia) {
    setHomeReady();
    return;
  }

  function resetHeroVisualState() {
    clearHomeReady();
    heroMedia.classList.remove("video-ready");
    hero.classList.remove("is-still", "is-blending");

    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (_) {}
    }
  }

  function revealStillOnly() {
    hero.classList.add("is-still");
    setHomeReady();
  }

  function revealVideo() {
    heroMedia.classList.add("video-ready");
    setHomeReady();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        revealStillOnly();
      });
    }
  }

  function bootHeroMedia() {
    resetHeroVisualState();

    if (!video || reduceMotion) {
      revealStillOnly();
      return;
    }

    let blendStarted = false;
    let readyShown = false;

    const markReady = () => {
      if (readyShown) return;
      readyShown = true;
      revealVideo();
    };

    video.addEventListener("loadeddata", markReady, { once: true });
    video.addEventListener("canplay", markReady, { once: true });

    video.addEventListener("timeupdate", () => {
      if (!video.duration || !isFinite(video.duration)) return;
      if (blendStarted) return;

      const blendLead = 1.2;
      if (video.currentTime >= video.duration - blendLead) {
        blendStarted = true;
        hero.classList.add("is-blending");
      }
    });

    video.addEventListener("ended", () => {
      hero.classList.add("is-still");
    });

    window.setTimeout(() => {
      if (!heroMedia.classList.contains("video-ready")) {
        revealStillOnly();
      }
    }, 1600);

    try {
      video.load();
      video.play().catch(() => {
        revealStillOnly();
      });
    } catch (_) {
      revealStillOnly();
    }
  }

  bootHeroMedia();

  window.addEventListener("pageshow", () => {
    bootHeroMedia();
  });
}

  /* =========================================================
     HERO FADE ON SCROLL
     Keeps your original scroll fade/lift logic.
     ========================================================= */

  function initHeroFade() {
    if (!hero) return;

    let raf = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const update = () => {
      raf = 0;

      if (hero.style.display === "none") return;

      const rect = hero.getBoundingClientRect();
      const heroH = Math.max(rect.height, window.innerHeight);
      const scrolled = Math.min(Math.max(-rect.top, 0), heroH);
      const p = heroH ? scrolled / heroH : 0;
      const e = easeOutCubic(clamp(p, 0, 1));

      const opacity = 1 - e * 1.08;
      const lift = e * 20;

      hero.style.opacity = String(Math.max(0, opacity));
      hero.style.transform = `translate3d(0, ${-lift}px, 0)`;
      hero.style.willChange = "opacity, transform";
      hero.style.pointerEvents = e > 0.92 ? "none" : "";
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("pageshow", update);
    update();
  }

  /* =========================================================
     MOBILE NAV
     Keeps your original logic and adds outside-click close.
     ========================================================= */

  function initMobileNav() {
    if (!burger || !nav) return;

    const closeNav = () => {
      body.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
    };

    burger.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        closeNav();
      }
    });

    document.addEventListener("click", (e) => {
      const clickedBurger = burger.contains(e.target);
      const clickedNav = nav.contains(e.target);

      if (!clickedBurger && !clickedNav && body.classList.contains("nav-open")) {
        closeNav();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeNav();
    });
  }

  /* =========================================================
     REVEALS
     Keeps your original logic.
     ========================================================= */

  function initReveal() {
    const revealNodes = document.querySelectorAll("[data-reveal]");
    if (!revealNodes.length) return;

    if (reduceMotion) {
      revealNodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    const revealIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -18% 0px" }
    );

    revealNodes.forEach((n) => revealIO.observe(n));

    window.addEventListener("pageshow", () => {
      revealNodes.forEach((n) => n.classList.add("is-in"));
    });
  }

  /* =========================================================
     TESTIMONIALS
     Keeps your autoplay + manual controls logic,
     but supports either .t-next/.t-prev or .next/.prev variants.
     ========================================================= */

  function initTestimonials() {
    const track = document.querySelector(".t-track");
    const slides = Array.from(document.querySelectorAll(".t-slide"));
    const next =
      document.querySelector(".t-next") ||
      document.querySelector(".t-arrow.next") ||
      document.querySelector(".t-arrow[data-next]");
    const prev =
      document.querySelector(".t-prev") ||
      document.querySelector(".t-arrow.prev") ||
      document.querySelector(".t-arrow[data-prev]");

    if (!track || !slides.length) return;

    let index = 0;
    const total = slides.length;

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
    }

    function nextSlide() {
      index += 1;
      if (index >= total) index = 0;
      update();
    }

    function prevSlide() {
      index -= 1;
      if (index < 0) index = total - 1;
      update();
    }

    let auto = setInterval(nextSlide, 6500);

    function restartAuto() {
      clearInterval(auto);
      auto = setInterval(nextSlide, 6500);
    }

    if (next) {
      next.addEventListener("click", () => {
        nextSlide();
        restartAuto();
      });
    }

    if (prev) {
      prev.addEventListener("click", () => {
        prevSlide();
        restartAuto();
      });
    }

    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* =========================================================
     HERO COLLAPSE
     Keeps your original “dismiss hero into about” behavior,
     but removes the old video blending logic since the new
     hero stabilization now handles video/still state.
     ========================================================= */

  function initHeroCollapse() {
    const heroEl = document.querySelector("[data-hero]");
    const aboutEl = document.getElementById("about");
    const cue = heroEl?.querySelector("[data-hero-next]");
    const navBrand = document.querySelector(".nav-brand");
    const aboutLink = document.querySelector('.site-nav a[href="#about"]');
    const HERO_DISMISSED_KEY = "maykeHeroDismissed";

    const navEntries = performance.getEntriesByType("navigation");
    const isReload =
      (navEntries.length && navEntries[0].type === "reload") ||
      performance.navigation?.type === 1;

    if (isReload) {
      sessionStorage.removeItem(HERO_DISMISSED_KEY);
    }

    if (!heroEl || !aboutEl) return;

    let heroDismissed = false;
    let animating = false;
    let touchStartY = null;

    const getAboutTop = () => {
      return Math.max(
        0,
        window.scrollY + aboutEl.getBoundingClientRect().top - getHeaderOffset()
      );
    };

    const easeInOutCubic = (t) =>
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const blockScroll = (e) => {
      if (!animating) return;
      e.preventDefault();
    };

    const blockKeys = (e) => {
      if (!animating) return;
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (keys.includes(e.key)) e.preventDefault();
    };

    const startBlock = () => {
      window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
      window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
      window.addEventListener("keydown", blockKeys, { capture: true });
    };

    const stopBlock = () => {
      window.removeEventListener("wheel", blockScroll, { capture: true });
      window.removeEventListener("touchmove", blockScroll, { capture: true });
      window.removeEventListener("keydown", blockKeys, { capture: true });
    };

    const dismissHeroIntoAbout = () => {
      if (heroDismissed || animating) return;

      animating = true;
      startBlock();

      const startHeight = heroEl.offsetHeight;
      const startScroll = window.scrollY;
      const duration = 1400;
      const start = performance.now();

      heroEl.style.height = `${startHeight}px`;
      heroEl.style.minHeight = `${startHeight}px`;
      heroEl.style.overflow = "hidden";
      heroEl.style.willChange = "height, opacity, transform";

      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const e = easeInOutCubic(t);

        const nextHeight = startHeight * (1 - e);
        const nextOpacity = 1 - e * 0.9;
        const lift = e * 14;

        heroEl.style.height = `${Math.max(0, nextHeight)}px`;
        heroEl.style.minHeight = `${Math.max(0, nextHeight)}px`;
        heroEl.style.opacity = String(Math.max(0, nextOpacity));
        heroEl.style.transform = `translate3d(0, ${-lift}px, 0)`;

        window.scrollTo(0, startScroll);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          heroDismissed = true;
          sessionStorage.setItem(HERO_DISMISSED_KEY, "1");
          animating = false;

          heroEl.style.display = "none";
          heroEl.style.opacity = "";
          heroEl.style.transform = "";
          heroEl.style.height = "";
          heroEl.style.minHeight = "";
          heroEl.style.overflow = "";
          heroEl.style.willChange = "";

          stopBlock();

          window.scrollTo({
            top: getAboutTop(),
            behavior: "auto",
          });
        }
      };

      requestAnimationFrame(step);
    };

    if (sessionStorage.getItem(HERO_DISMISSED_KEY) === "1") {
      heroDismissed = true;
      heroEl.style.display = "none";
      clearHomeReady();
      setHomeReady();
    }

    cue?.addEventListener("click", dismissHeroIntoAbout);

    const onWheel = (e) => {
      if (heroDismissed || animating) return;
      if (window.scrollY > 4) return;

      if (e.deltaY > 0) {
        e.preventDefault();
        dismissHeroIntoAbout();
      }
    };

    const onKey = (e) => {
      if (heroDismissed || animating) return;
      if (window.scrollY > 4) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        dismissHeroIntoAbout();
      }
    };

    const onTouchStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      touchStartY = t.clientY;
    };

    const onTouchMove = (e) => {
      if (heroDismissed || animating) return;
      if (window.scrollY > 4) return;
      if (touchStartY == null) return;

      const t = e.touches?.[0];
      if (!t) return;

      const dy = touchStartY - t.clientY;
      if (dy > 8) {
        e.preventDefault();
        dismissHeroIntoAbout();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    navBrand?.addEventListener("click", (e) => {
      if (!aboutEl) return;
      e.preventDefault();
      dismissHeroIntoAbout();
    });

    aboutLink?.addEventListener("click", (e) => {
      e.preventDefault();
      dismissHeroIntoAbout();
    });
  }

  /* =========================================================
     CAPABILITIES
     Keeps your original logic.
     ========================================================= */

  function initCapabilities() {
    const stack =
      document.querySelector("[data-capabilities-stack]") ||
      document.querySelector(".capabilities-stack");

    const cards = Array.from(
      document.querySelectorAll("[data-cap-card], .cap-card")
    );

    const cue = document.querySelector(".capabilities-scroll-cue");
    const title = document.querySelector(".capabilities-title");

    if (!stack || !cards.length) return;

    let lastScrollTop = stack.scrollTop;

    const update = () => {
      const stackRect = stack.getBoundingClientRect();
      const stackCenter = stackRect.top + stackRect.height / 2;

      let activeIndex = 0;
      let closest = Infinity;

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - stackCenter);

        if (dist < closest) {
          closest = dist;
          activeIndex = i;
        }
      });

      cards.forEach((card, i) => {
        card.classList.toggle("is-active", i === activeIndex);
      });

      if (title) {
        title.classList.toggle("is-hidden", stack.scrollTop > 10);
      }

      if (cue) {
        const currentScrollTop = stack.scrollTop;
        const atTop = currentScrollTop <= 4;
        const atBottom =
          currentScrollTop + stack.clientHeight >= stack.scrollHeight - 4;

        const scrollingDown = currentScrollTop > lastScrollTop;
        const scrollingUp = currentScrollTop < lastScrollTop;

        if (atTop) {
          cue.classList.remove("is-hidden");
          cue.classList.remove("is-up");
        } else if (atBottom) {
          cue.classList.remove("is-hidden");
          cue.classList.add("is-up");
        } else if (scrollingDown || scrollingUp) {
          cue.classList.add("is-hidden");
        }

        lastScrollTop = currentScrollTop;
      }
    };

    stack.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("pageshow", update);
    update();
  }

  /* =========================================================
     PAGE TRANSITIONS
     Keeps your original logic.
     ========================================================= */

  function initPageTransitions() {
    document.body.classList.add("is-entering");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBodyReady();
      });
    });

    const links = Array.from(document.querySelectorAll('a[href]'));

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        const target = link.getAttribute("target");

        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          target === "_blank" ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

        const url = new URL(href, window.location.href);

        if (url.origin !== window.location.origin) return;
        if (url.href === window.location.href) return;

        e.preventDefault();

        document.body.classList.add("is-leaving");

        window.setTimeout(() => {
          window.location.href = url.href;
        }, 320);
      });
    });
  }

  /* =========================================================
     INQUIRY FORM
     Keeps your original submission logic.
     ========================================================= */

  function initInquiryForm() {
    const form = document.getElementById("inquiry-form");
    const status = document.getElementById("form-status");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);

      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        message: String(formData.get("message") || "").trim(),
      };

      if (!payload.name || !payload.email || !payload.message) {
        if (status) status.textContent = "Please fill out all fields.";
        return;
      }

      submitBtn?.setAttribute("disabled", "true");
      if (status) status.textContent = "Sending...";

      try {
        const res = await fetch("/api/inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const raw = await res.text();

        let data;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = { error: raw || "Unexpected server response." };
        }

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong.");
        }

        form.reset();
        if (status) status.textContent = "Inquiry sent successfully.";

        setTimeout(() => {
          if (status) status.textContent = "";
        }, 4000);
      } catch (error) {
        if (status) status.textContent = error.message || "Unable to send inquiry.";
      } finally {
        submitBtn?.removeAttribute("disabled");
      }
    });
  }

  /* =========================================================
     LAZY VIDEOS
     Keeps your original logic.
     ========================================================= */

  function initLazyVideos() {
    const videos = Array.from(document.querySelectorAll("video"));
    if (!videos.length) return;

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const video = entry.target;
        const sources = Array.from(video.querySelectorAll("source[data-src]"));

        if (sources.length) {
          sources.forEach((source) => {
            source.src = source.dataset.src;
            source.removeAttribute("data-src");
          });

          video.load();

          if (video.autoplay) {
            video.play().catch(() => {});
          }
        }

        observer.unobserve(video);
      });
    }, {
      rootMargin: "200px 0px"
    });

    videos.forEach((video) => {
      if (video.querySelector("source[data-src]")) {
        io.observe(video);
      }
    });
  }

  /* =========================================================
     INIT
     ========================================================= */

  initYear();
  initHeader();
  initHeroMedia();
  initHeroFade();
  initMobileNav();
  initHeroCollapse();
  initPageTransitions();
  initInquiryForm();

  window.requestAnimationFrame(() => {
    initReveal();
    initTestimonials();
    initCapabilities();
    initLazyVideos();
  });
});