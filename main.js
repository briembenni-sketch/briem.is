/* briem.is — interactions
   Lightweight, dependency-free. Respects prefers-reduced-motion. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- reveal on scroll + talning ---- */
  var countUp = function (el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || "0", 10);
    var suffix = el.dataset.suffix || "";
    var start = null, dur = 1400;
    var step = function (now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var revealEls = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- fyrirsögnin afkóðast við hleðslu ---- */
  if (!reduced) {
    var glyphs = "ABDEFGHKLMNOPRSTUVXYZÞÆÖ0123456789/<>_#";
    document.querySelectorAll("[data-scramble]").forEach(function (el, i) {
      var final = el.textContent;
      var start = performance.now() + 150 + i * 220;
      var dur = 650;
      var frame = function (now) {
        var p = (now - start) / dur;
        if (p >= 1) { el.textContent = final; return; }
        var done = Math.max(0, Math.floor(p * final.length));
        var out = final.slice(0, done);
        for (var k = done; k < final.length; k++) {
          out += final[k] === " " ? " " : glyphs[(Math.random() * glyphs.length) | 0];
        }
        el.textContent = out;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---- verkaskoðari ---- */
  var viewer = document.querySelector("[data-viewer]");
  if (viewer) {
    var slides = viewer.querySelectorAll(".slide");
    var tabs = viewer.querySelectorAll(".viewer-tab");
    var idxEl = viewer.querySelector("[data-viewer-index]");
    var domEl = viewer.querySelector("[data-viewer-domain]");
    var current = 0;
    var go = function (n) {
      var next = (n + slides.length) % slides.length;
      if (next === current) return;
      var prev = current;
      current = next;
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === current);
        s.classList.toggle("is-prev", i === prev);
      });
      tabs.forEach(function (t, i) {
        t.classList.toggle("is-active", i === current);
        t.setAttribute("aria-pressed", i === current ? "true" : "false");
      });
      var s = slides[current];
      viewer.style.setProperty("--c", s.dataset.c);
      if (idxEl) idxEl.textContent = ("0" + (current + 1)).slice(-2);
      if (domEl) domEl.textContent = s.dataset.domain;
    };
    viewer.style.setProperty("--c", slides[0].dataset.c);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { go(i); });
      /* fyllingin í flipanum er tímamælirinn: þegar hún klárast flettum við */
      t.addEventListener("animationend", function (e) {
        if (e.animationName === "fill") go(current + 1);
      });
    });
  }

  /* ---- skjáskot hallast á eftir bendlinum ---- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".project-shot").forEach(function (shot) {
      shot.addEventListener("pointermove", function (e) {
        var r = shot.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        shot.classList.add("is-tilting");
        shot.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
        shot.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
      });
      shot.addEventListener("pointerleave", function () {
        shot.classList.remove("is-tilting");
        shot.style.setProperty("--ry", "0deg");
        shot.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* ---- punktanetið í hero ----
     Kyrrt net af punktum. Bylgjur ferðast yfir það með reglulegu millibili,
     bendillinn kveikir á punktunum í kringum sig og smellur sendir nýja bylgju. */
  var canvas = document.querySelector(".hero-field");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var GAP = 28, LIFE = 4200, SPEED = 0.2, BAND = 70, REACH = 170;
    var W = 0, H = 0, ripples = [], px = -9999, py = -9999, lastSpawn = 0, raf = 0, visible = true;

    var resize = function () {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var draw = function (now) {
      ctx.clearRect(0, 0, W, H);
      var offX = (W % GAP) / 2, offY = (H % GAP) / 2;
      for (var y = offY; y < H; y += GAP) {
        for (var x = offX; x < W; x += GAP) {
          var e = 0, dx = 0, dy = 0;
          for (var i = 0; i < ripples.length; i++) {
            var rp = ripples[i], age = now - rp.t;
            var diff = Math.abs(Math.hypot(x - rp.x, y - rp.y) - age * SPEED);
            if (diff < BAND) e += (1 - diff / BAND) * (1 - age / LIFE);
          }
          var dp = Math.hypot(x - px, y - py);
          if (dp < REACH) {
            var k = 1 - dp / REACH;
            e += k * k;
            if (dp > 0.01) { dx = (x - px) / dp * k * 7; dy = (y - py) / dp * k * 7; }
          }
          if (e > 0.02) {
            if (e > 1) e = 1;
            var size = 1.5 + e * 3;
            ctx.globalAlpha = 0.2 + e * 0.8;
            ctx.fillStyle = "#5B8CFF";
            ctx.fillRect(x + dx - size / 2, y + dy - size / 2, size, size);
          } else {
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    var loop = function (now) {
      if (now - lastSpawn > 1900) {
        ripples.push({ x: Math.random() * W, y: Math.random() * H, t: now });
        lastSpawn = now;
      }
      ripples = ripples.filter(function (r) { return now - r.t < LIFE; });
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    var start = function () { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop); };
    var stop = function () { cancelAnimationFrame(raf); raf = 0; };

    resize();
    window.addEventListener("resize", function () { resize(); if (reduced) draw(0); });

    if (reduced) {
      draw(0);
    } else {
      hero.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top;
      });
      hero.addEventListener("pointerleave", function () { px = py = -9999; });
      hero.addEventListener("pointerdown", function (e) {
        var r = canvas.getBoundingClientRect();
        ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      });
      document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          visible ? start() : stop();
        }).observe(hero);
      }
      start();
    }
  }
})();
