/* ===== The Style Katha — Infinite draggable marquees =====
   Converts the CSS-animated product rows (.marquee-wrap) and the category
   strip (.cat-track) into JS-driven loops that are truly infinite BOTH ways:
   they keep auto-scrolling AND you can grab/swipe them by hand — content
   wraps seamlessly with no gaps, on desktop AND mobile (Pointer Events +
   touch fallback, and the loop width re-measures itself as images load).
   Include AFTER featured.js.
*/
(function () {
  function enhance(wrap, trackSel, scrollDir) {
    if (wrap.dataset.mqInit) return;
    var all = wrap.querySelectorAll(trackSel);
    var track = all[0];
    if (!track || !track.children.length) return;
    // Remove the duplicate aria-hidden track — we handle wrapping ourselves
    if (all[1] && all[1].parentNode) all[1].parentNode.removeChild(all[1]);
    track.style.animation = "none";
    track.style.willChange = "transform";
    wrap.style.touchAction = "pan-y"; // vertical page scroll keeps working

    var P = 0;   // ONE repeat-unit of the content, px (NOT the whole track)
    var n0 = 0;  // number of cards in one repeat-unit

    function measure() {
      var vw = window.innerWidth || 1200;
      var n = track.children.length;
      if (!n) return;
      if (!n0) n0 = n; // remember the size of the original single set

      // Keep enough copies that the screen is always covered, even when
      // offset is anywhere inside the period: total >= period + viewport
      var guard = 0;
      while (track.scrollWidth < P + vw * 1.5 && guard++ < 14) {
        track.innerHTML += track.innerHTML; // content is periodic → seamless
      }

      // Period = total width ÷ number of copies. Self-corrects as images
      // load and card widths change on mobile.
      var w = track.scrollWidth;
      if (w > 0) P = w * (n0 / track.children.length);

      // Re-measure whenever an image finishes loading
      var imgs = track.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        if (!imgs[i].dataset.mqWatched) {
          imgs[i].dataset.mqWatched = "1";
          imgs[i].addEventListener("load", function () {
            if (track.scrollWidth > 0) P = track.scrollWidth * (n0 / track.children.length);
            normalize();
          });
        }
      }
    }

    var offset = 0, dragging = false, lastX = 0, moved = 0, SPEED = 70; // px/s
    var dir = scrollDir === -1 ? -1 : 1;
    // dir = 1 → content moves right-to-left (standard)
    // dir = -1 → content moves left-to-right
    function apply() { track.style.transform = "translate3d(" + (-offset) + "px,0,0)"; }
    function normalize() {
      if (P <= 0) return;
      offset = ((offset % P) + P) % P;
      apply();
    }

    var last = performance.now(), frame = 0;
    function loop(now) {
      var dt = Math.min(64, now - last); last = now;
      if (!dragging && P > 0) {
        offset += (dir * SPEED * dt) / 1000;
        normalize();
      }
      // Re-measure periodically — cheap safety net for late-loading media
      if ((frame++ & 63) === 0) measure();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* --- Drag / swipe --- */
    function startDrag(x) { dragging = true; moved = 0; lastX = x; }
    function moveDrag(x) {
      if (!dragging) return;
      var dx = x - lastX; lastX = x; moved += Math.abs(dx);
      if (P > 0) { offset -= dx; normalize(); }
    }
    function endDrag() { dragging = false; }

    if ("PointerEvent" in window) {
      wrap.addEventListener("pointerdown", function (e) {
        startDrag(e.clientX);
        try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      });
      wrap.addEventListener("pointermove", function (e) { moveDrag(e.clientX); });
      wrap.addEventListener("pointerup", endDrag);
      wrap.addEventListener("pointercancel", endDrag);
    } else {
      // Old iOS/Android fallback (no Pointer Events)
      wrap.addEventListener("touchstart", function (e) {
        startDrag(e.touches[0].clientX);
      }, { passive: true });
      wrap.addEventListener("touchmove", function (e) {
        moveDrag(e.touches[0].clientX);
      }, { passive: true });
      wrap.addEventListener("touchend", endDrag);
      wrap.addEventListener("touchcancel", endDrag);
    }

    // Don't open a product link after an actual drag gesture
    wrap.addEventListener("click", function (e) {
      if (moved > 10) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);

    window.addEventListener("resize", function () { P = 0; measure(); normalize(); });

    wrap.dataset.mqInit = "1";
    measure();
  }

  var productRowIndex = 0; // alternate direction per category row
  function run() {
    document.querySelectorAll(".marquee-wrap").forEach(function (w) {
      enhance(w, ".product-track", (productRowIndex++ % 2 === 0) ? 1 : -1);
    });
    document.querySelectorAll(".cat-strip").forEach(function (w) { enhance(w, ".cat-track", 1); });
  }

  var retries = 0;
  function runWhenReady() {
    run();
    // Tracks are filled async from Supabase; retry briefly until present
    if (retries++ < 20) setTimeout(runWhenReady, 400);
  }
  runWhenReady();
  // Featured rows re-render on resize/rotation — re-apply to the new nodes
  var mount = document.getElementById("featuredCategories");
  if (mount && "MutationObserver" in window) {
    new MutationObserver(function () { setTimeout(run, 60); }).observe(mount, { childList: true });
  }
})();