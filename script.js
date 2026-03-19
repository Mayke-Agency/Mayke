/* =========================================================
   MAYKE — script.js 
   ========================================================= */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  // Elements
  const header = document.querySelector("[data-header]") || document.querySelector(".site-header");
  const hero   = document.querySelector("[data-hero]")   || document.querySelector(".hero");
  const about  = document.getElementById("about");
  const burger = document.querySelector("[data-burger]") || document.querySelector(".nav-toggle");
  const nav    = document.querySelector("[data-nav]")    || document.querySelector(".site-nav");

  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     Helpers
  ========================================================= */
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const maxScrollY = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const centerTargetForEl = (el) => {
    const r = el.getBoundingClientRect();
    return window.scrollY + r.top - (window.innerHeight / 2) + (r.height / 2);
  };

  const wheelDeltaToPx = (e) => {
    // deltaMode: 0=pixel, 1=line, 2=page
    if (e.deltaMode === 1) return e.deltaY * 16;
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
    return e.deltaY;
  };

  /* =========================================================
     Header show/hide until About enters
  ========================================================= */

if (header) {
  // If there's no about section on this page, never hide the header
  if (!about) {
    header.classList.remove("is-hidden");
  } else {
    const setHeaderVisible = (visible) =>
      header.classList.toggle("is-hidden", !visible);

    // Start hidden near top (home)
    if (window.scrollY < 30) setHeaderVisible(false);

    const navIO = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeaderVisible(entry.isIntersecting);
      },
      { threshold: 0.01, rootMargin: "-15% 0px -70% 0px" }
    );

    navIO.observe(about);
  }
}

  /* =========================================================
     Hero fade away on scroll
  ========================================================= */
  if (hero) {
    let raf = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const update = () => {
      raf = 0;

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
    update();
  }

  /* =========================================================
     Mobile menu
  ========================================================= */
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     Reveal on scroll
  ========================================================= */
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (revealNodes.length) {
    if (reduceMotion) {
      revealNodes.forEach((n) => n.classList.add("is-in"));
    } else {
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
    }
  }

  /* =========================================================
   TESTIMONIALS — auto + manual infinite loop
   ========================================================= */

(() => {

  const track = document.querySelector(".t-track");
  const slides = Array.from(document.querySelectorAll(".t-slide"));
  const next = document.querySelector(".t-next");
  const prev = document.querySelector(".t-prev");

  if (!track || !slides.length) return;

  let index = 0;
  const total = slides.length;

  function update(){
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function nextSlide(){
    index++;
    if(index >= total){
      index = 0; // loop back to first
    }
    update();
  }

  function prevSlide(){
    index--;
    if(index < 0){
      index = total - 1; // loop to end
    }
    update();
  }

  if(next){
    next.addEventListener("click", () => {
      nextSlide();
      restartAuto();
    });
  }

  if(prev){
    prev.addEventListener("click", () => {
      prevSlide();
      restartAuto();
    });
  }

  /* =========================
     AUTO PLAY
  ========================= */

  let auto = setInterval(nextSlide, 6500);

  function restartAuto(){
    clearInterval(auto);
    auto = setInterval(nextSlide, 6500);
  }

})();

   /* =========================================================
   HERO — play once, fade to still, cue scroll, collapse hero into About
   ========================================================= */
(() => {
  const hero = document.querySelector("[data-hero]");
  const about = document.getElementById("about");
  const video = hero?.querySelector(".hero-video");
  const cue = hero?.querySelector("[data-hero-next]");
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

  if (!hero || !about) return;

  let heroDismissed = false;
  let animating = false;
  let touchStartY = null;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getHeaderOffset = () => {
    const header = document.querySelector(".site-header");
    return header ? header.offsetHeight : 0;
  };

  const getAboutTop = () => {
    return Math.max(
      0,
      window.scrollY + about.getBoundingClientRect().top - getHeaderOffset()
    );
  };

  /* video -> still image */
if (video) {
  const showStill = () => hero.classList.add("is-still");
  const startStillBlend = () => hero.classList.add("is-blending");

  let blendStarted = false;

  const onTimeUpdate = () => {
    if (blendStarted) return;
    if (!video.duration || !isFinite(video.duration)) return;

    const blendLead = 3; // seconds before the end
    if (video.currentTime >= video.duration - blendLead) {
      blendStarted = true;
      startStillBlend();
    }
  };

  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("ended", showStill);

  if (reduceMotion) {
    startStillBlend();
    showStill();
    video.pause();
  } else {
    video.play().catch(() => {
    // keep the poster / first frame instead of immediately forcing the still image
    console.warn("Hero video autoplay failed.");
  });;
  }
}

  const easeInOutCubic = (t) =>
    t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* block user scroll during collapse so momentum can't push past About */
  const blockScroll = (e) => {
    if (!animating) return;
    e.preventDefault();
  };

  const blockKeys = (e) => {
    if (!animating) return;
    const keys = [
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " "
    ];
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

    const goToAboutAndDismissHero = (e) => {
  if (!hero || !about) return;

  e.preventDefault();

  if (heroDismissed) {
    window.scrollTo({
      top: Math.max(0, about.offsetTop - getHeaderOffset()),
      behavior: "smooth"
    });
    return;
  }

  dismissHeroIntoAbout();
};

    animating = true;
    startBlock();

    const startHeight = hero.offsetHeight;
    const startScroll = window.scrollY;
    const duration = reduceMotion ? 0 : 1400; // slower
    const start = performance.now();

    hero.style.height = `${startHeight}px`;
    hero.style.minHeight = `${startHeight}px`;
    hero.style.overflow = "hidden";
    hero.style.willChange = "height, opacity, transform";

    const step = (now) => {
      const t = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const e = easeInOutCubic(t);

      const nextHeight = startHeight * (1 - e);
      const nextOpacity = 1 - e * 0.9;
      const lift = e * 14;

      hero.style.height = `${Math.max(0, nextHeight)}px`;
      hero.style.minHeight = `${Math.max(0, nextHeight)}px`;
      hero.style.opacity = String(Math.max(0, nextOpacity));
      hero.style.transform = `translate3d(0, ${-lift}px, 0)`;

      /* keep page anchored during collapse */
      window.scrollTo(0, startScroll);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        heroDismissed = true;
        sessionStorage.setItem(HERO_DISMISSED_KEY, "1");
        animating = false;

        hero.style.display = "none";
        hero.style.opacity = "";
        hero.style.transform = "";
        hero.style.height = "";
        hero.style.minHeight = "";
        hero.style.overflow = "";
        hero.style.willChange = "";

        stopBlock();

        /* land exactly on About */
        window.scrollTo({
          top: getAboutTop(),
          behavior: "auto"
        });
      }
    };

    requestAnimationFrame(step);
  };

  /* if hero was already dismissed earlier in this session, keep it gone */
if (sessionStorage.getItem(HERO_DISMISSED_KEY) === "1") {
  heroDismissed = true;
  hero.style.display = "none";
}

  /* cue button */
  cue?.addEventListener("click", dismissHeroIntoAbout);

  /* first downward scroll triggers the same collapse */
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

    const dy = touchStartY - t.clientY; // swipe up = scroll down
    if (dy > 8) {
      e.preventDefault();
      dismissHeroIntoAbout();
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  /* nav logo + about link dismiss hero too */
  navBrand?.addEventListener("click", (e) => {
    e.preventDefault();
    dismissHeroIntoAbout();
  });

  aboutLink?.addEventListener("click", (e) => {
    e.preventDefault();
    dismissHeroIntoAbout();
  });
})();
/* =========================================================
   Capabilities stack — internal scroll
   ========================================================= */
(() => {
  const stack = document.querySelector("[data-capabilities-stack]");
  const cards = Array.from(document.querySelectorAll("[data-cap-card]"));
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
  update();
})();
/* =========================================================
   Page transitions
   ========================================================= */
(() => {
  document.body.classList.add("is-entering");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove("is-entering");
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
})();
/* =========================================================
   Inquiry form submit
   ========================================================= */
(() => {
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
    } catch (error) {
      if (status) status.textContent = error.message || "Unable to send inquiry.";
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  });
})();
})();
