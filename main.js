/* briem.is — interactions
   Lightweight, dependency-free. Respects prefers-reduced-motion. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;
  var pad = function (n, len) { return ("0000" + n).slice(-len); };

  /* ---- current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- texti sem afkóðast ---- */
  var glyphs = "ABDEFGHKLMNOPRSTUVXYZÞÆÖ0123456789/<>_#";
  var scramble = function (el, delay) {
    if (reduced || el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    var final = el.textContent;
    var start = performance.now() + delay;
    var dur = Math.min(900, 350 + final.length * 30);
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
  };
  /* fyrirsögnin í hero strax, annað þegar það kemur í sjónmál */
  document.querySelectorAll(".hero-title [data-scramble]").forEach(function (el, i) {
    scramble(el, 150 + i * 220);
  });

  /* ---- talning ---- */
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

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduced || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        el.querySelectorAll("[data-count]").forEach(countUp);
        el.querySelectorAll("[data-scramble]").forEach(function (s) { scramble(s, 100); });
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- hero: verkin rúlla ----
     Framvindulínan í glugganum er tímamælirinn: þegar hún klárast flettum við. */
  var viewer = document.querySelector("[data-viewer]");
  if (viewer) {
    var slides = viewer.querySelectorAll(".slide");
    var phones = viewer.querySelectorAll(".hslide");
    var idxEl = viewer.querySelector("[data-viewer-index]");
    var domEl = viewer.querySelector("[data-viewer-domain]");
    var timer = viewer.querySelector(".viewer-progress .fill");
    var current = 0;
    var go = function (n) {
      var prev = current;
      current = (n + slides.length) % slides.length;
      [slides, phones].forEach(function (set) {
        set.forEach(function (s, i) {
          s.classList.toggle("is-active", i === current);
          s.classList.toggle("is-prev", i === prev);
        });
      });
      var s = slides[current];
      viewer.style.setProperty("--c", s.dataset.c);
      if (idxEl) idxEl.textContent = pad(current + 1, 2);
      if (domEl) domEl.textContent = s.dataset.domain;
      if (timer) { /* endurræsa tímamælinn */
        timer.style.animation = "none";
        void timer.offsetWidth;
        timer.style.animation = "";
      }
    };
    viewer.style.setProperty("--c", slides[0].dataset.c);
    if (timer) timer.addEventListener("animationend", function () { go(current + 1); });
  }

  /* ---- hero: gluggarnir hallast á eftir bendlinum + hnit í mælaborðslínu ---- */
  var rig = document.querySelector(".showcase-rig");
  var heroEl = document.querySelector(".hero");
  if (heroEl && finePointer) {
    var hudX = heroEl.querySelector("[data-hud-x]");
    var hudY = heroEl.querySelector("[data-hud-y]");
    var tx = 0, ty = 0, cx = 0, cy = 0, tilting = 0;
    var tiltStep = function () {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      rig.style.setProperty("--px", cx.toFixed(3));
      rig.style.setProperty("--py", cy.toFixed(3));
      tilting = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tiltStep) : 0;
    };
    var aim = function (x, y) {
      tx = x; ty = y;
      if (rig && !reduced && !tilting) tilting = requestAnimationFrame(tiltStep);
    };
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (hudX) hudX.textContent = pad(Math.round(x), 4);
      if (hudY) hudY.textContent = pad(Math.round(y), 4);
      aim((x / r.width - 0.5) * 2, (y / r.height - 0.5) * 2);
    });
    heroEl.addEventListener("pointerleave", function () { aim(0, 0); });
  }

  /* ---- sýnidæmi: hvert skref velur myndina á skjánum ----
     Fyllingin í virka skrefinu er tímamælirinn. Hún keyrir aðeins meðan
     verkið er í sjónmáli og hættir alveg um leið og gesturinn velur sjálfur. */
  document.querySelectorAll("[data-console]").forEach(function (con) {
    var steps = con.querySelectorAll(".step");
    var shots = con.querySelectorAll(".shot");
    var view = con.querySelector(".stage-view");
    var labelEl = con.querySelector(".stage [data-label]");
    var idxEl = con.querySelector("[data-idx]");
    var cur = 0;
    var show = function (n) {
      var next = (n + steps.length) % steps.length;
      if (next === cur) return;
      var prev = cur;
      cur = next;
      shots.forEach(function (s, i) {
        s.classList.toggle("is-active", i === cur);
        s.classList.toggle("is-prev", i === prev);
      });
      steps.forEach(function (s, i) {
        s.classList.toggle("is-active", i === cur);
        s.setAttribute("aria-pressed", i === cur ? "true" : "false");
      });
      if (labelEl) labelEl.textContent = steps[cur].dataset.label;
      if (idxEl) idxEl.textContent = pad(cur + 1, 2);
      if (view && !reduced) {
        view.classList.remove("is-scanning");
        void view.offsetWidth;
        view.classList.add("is-scanning");
      }
    };
    steps.forEach(function (s, i) {
      s.addEventListener("click", function () { con.classList.add("is-manual"); show(i); });
      s.addEventListener("animationend", function (e) {
        if (e.animationName === "stepFill") show(cur + 1);
      });
    });
    if (!reduced && hasIO) {
      new IntersectionObserver(function (entries) {
        con.classList.toggle("is-live", entries[0].isIntersecting);
      }, { threshold: 0.35 }).observe(con);
    }
  });

  /* ---- undir húddinu: raunveruleg mæling úr vafranum ----
     Allar tölur koma úr Performance API fyrir þessa heimsókn. Línu sem
     vafrinn gefur ekki upp er einfaldlega sleppt, aldrei giskað. */
  var term = document.querySelector("[data-term]");
  if (term && window.performance && performance.getEntriesByType) {
    var body = term.querySelector(".term-body");
    var measure = function () {
      var rows = [];
      var nav = performance.getEntriesByType("navigation")[0];
      var fcp = performance.getEntriesByType("paint").filter(function (p) { return p.name === "first-contentful-paint"; })[0];
      var ms = function (v) { return Math.round(v) + " ms"; };
      if (nav && nav.responseStart > 0 && nav.responseStart >= nav.requestStart) rows.push(["svar frá netþjóni", ms(nav.responseStart - nav.requestStart)]);
      if (fcp) rows.push(["fyrsta mynd á skjá", ms(fcp.startTime)]);
      if (nav && nav.domContentLoadedEventEnd > 0) rows.push(["síðan orðin virk", ms(nav.domContentLoadedEventEnd)]);
      if (nav && nav.loadEventEnd > 0) rows.push(["síðan fullhlaðin", ms(nav.loadEventEnd)]);
      rows.push(["forritasöfn", "0"]);
      rows.push(["vafrakökur", String(document.cookie ? document.cookie.split(";").length : 0)]);
      return rows;
    };
    var print = function () {
      var rows = measure();
      var host = location.hostname || "projectbriem.is";
      var time = new Date().toLocaleTimeString("en-GB", { hour12: false });
      var lines = ['<div class="cmd">briem mæla ' + host + "</div>"]
        .concat(rows.map(function (r) { return '<div class="row"><span>' + r[0] + "</span><i></i><b>" + r[1] + "</b></div>"; }))
        .concat(['<div class="ok">✓ mælt í þínum vafra kl. ' + time + '<span class="caret"></span></div>']);
      body.innerHTML = "";
      if (reduced) { body.innerHTML = lines.join(""); return; }
      lines.forEach(function (html, i) {
        setTimeout(function () { body.insertAdjacentHTML("beforeend", html); }, 150 + i * 190);
      });
    };
    var run = function () { /* bíðum þar til síðan er fullhlaðin svo tölurnar séu endanlegar */
      if (document.readyState === "complete") setTimeout(print, 60);
      else window.addEventListener("load", function () { setTimeout(print, 60); });
    };
    if (hasIO) {
      var tio = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        tio.disconnect();
        run();
      }, { threshold: 0.3 });
      tio.observe(term);
    } else run();
  }

  /* ---- ferlið: línan fyllist eftir skrolli ---- */
  var pipe = document.querySelector("[data-pipe]");
  if (pipe && !reduced) {
    var pipeSteps = pipe.querySelectorAll(".pipe-step");
    var pipeRaf = 0;
    var pipeUpdate = function () {
      pipeRaf = 0;
      var r = pipe.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.82 - r.top) / Math.max(r.height, vh * 0.45);
      p = Math.max(0, Math.min(1, p));
      pipe.style.setProperty("--p", p.toFixed(3));
      pipeSteps.forEach(function (s, i) { s.classList.toggle("on", p > i / pipeSteps.length + 0.02); });
    };
    var pipeQueue = function () { if (!pipeRaf) pipeRaf = requestAnimationFrame(pipeUpdate); };
    window.addEventListener("scroll", pipeQueue, { passive: true });
    window.addEventListener("resize", pipeQueue);
    pipeUpdate();
  } else if (pipe) {
    pipe.querySelectorAll(".pipe-step").forEach(function (s) { s.classList.add("on"); });
  }

  /* ---- hliðarleiðsögn: merkir kaflann sem er á skjánum ---- */
  var railLinks = document.querySelectorAll(".rail a");
  if (railLinks.length && hasIO) {
    var byId = {};
    railLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        railLinks.forEach(function (a) { a.classList.remove("is-current"); });
        byId[entry.target.id].classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) rio.observe(el);
    });
  }

  /* ---- punktanet (hero og samband) ----
     Kyrrt net af punktum. Bylgjur ferðast yfir það með reglulegu millibili,
     bendillinn kveikir á punktunum í kringum sig og smellur sendir nýja bylgju. */
  var initField = function (canvas) {
    if (!canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var GAP = 28, LIFE = 4200, SPEED = 0.2, BAND = 70, REACH = 170;
    var W = 0, H = 0, ripples = [], px = -9999, py = -9999, lastSpawn = 0, raf = 0, visible = false;

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
    var start = function () { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
    var stop = function () { cancelAnimationFrame(raf); raf = 0; };

    resize();
    window.addEventListener("resize", function () { resize(); if (reduced) draw(0); });
    if (reduced) { draw(0); return; }

    host.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
    });
    host.addEventListener("pointerleave", function () { px = py = -9999; });
    host.addEventListener("pointerdown", function (e) {
      var r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(host);
    } else { visible = true; start(); }
  };
  document.querySelectorAll("canvas.field").forEach(initField);
})();
