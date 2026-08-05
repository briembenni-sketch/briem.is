/* briem.is — interactions
   Lightweight, dependency-free. Respects prefers-reduced-motion. */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- sticky header state ---- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile menu ---- */
  var toggle = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Loka valmynd" : "Opna valmynd");
      if (open) {
        mobileNav.hidden = false;
      } else {
        mobileNav.hidden = true;
      }
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---- hero: flakk milli fyrri verka ---- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".slider-dots span"));
  var caption = document.querySelector(".hero-caption");
  if (slides.length > 1) {
    var current = 0;
    var timer = null;

    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === current); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === current); });
      var slide = slides[current];
      if (caption) {
        caption.href = slide.getAttribute("data-url");
        caption.querySelector(".hero-caption-name").textContent = slide.getAttribute("data-name");
        caption.querySelector(".hero-caption-domain").textContent = slide.getAttribute("data-domain") + " ↗";
      }
    };

    var restart = function () {
      if (timer) clearInterval(timer);
      if (!prefersReduced) {
        timer = setInterval(function () { show(current + 1); }, 6000);
      }
    };

    document.querySelectorAll(".slider-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        show(current + Number(btn.getAttribute("data-dir")));
        restart();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (window.scrollY > window.innerHeight * 0.6) return;
      show(current + (e.key === "ArrowRight" ? 1 : -1));
      restart();
    });

    restart();
  }

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
