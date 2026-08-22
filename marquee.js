/* ===== The Style Katha — Infinite draggable marquees =====
   Converts the CSS-animated product rows (.marquee-wrap) and the category
   strip (.cat-strip) into JS-driven loops that are truly infinite BOTH ways:
   they keep auto-scrolling AND you can grab/swipe them by hand — the content
   wraps around seamlessly with no gaps or dead ends.
   Include AFTER featured.js.
*/
(function () {
  function enhance(wrap, trackSel) {
    if (wrap.dataset.mqInit) return;
    var all = wrap.querySelectorAll(trackSel);
    var track = all[0];
    if (!track || !track.children.length) return;
    // Remove the duplicate aria-hidden track — we handle wrapping ourselves
    if (all[1] && all[1].parentNode) all[1].parentNode.removeChild(all[1]);
    track.style.animation = "none";
    wrap.style.touchAction = "pan-y"; // keep vertical page scroll working

    var P = 0; // one full period of the repeated content, px
    function measure() {
      var vw = window.innerWidth || 1200;
      var guard = 0;
      while (track.scrollWidth < vw * 2 && guard++ < 10) {
        track.innerHTML += track.innerHTML; // content is periodic, safe to double
      }
      P = track.scrollWidth;
    }
    measure();

    var offset = 0, dragging = false, lastX = 0, moved = 0, SPEED = 35; // px/s
    function apply() { track.style.transform = "translate3d(" + -offset + "px,0,0)"; }

    var last = performance.now();
    function loop(now) {
      var dt = Math.min(64, now - last); last = now;
      if (!dragging && P > 0) {
        offset = (offset + (SPEED * dt) / 1000) % P;
        apply();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    wrap.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; lastX = e.clientX;
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!dragging || P <= 0) return;
      var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      offset = ((offset - dx) % P + P) % P;
      apply();
    });
    function end() { dragging = false; }
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);

    // Don't open a product link after an actual drag gesture
    wrap.addEventListener("click", function (e) {
      if (moved > 10) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);

    window.addEventListener("resize", function () {
      measure();
      offset = P ? offset % P : 0;
    });

    wrap.dataset.mqInit = "1";
  }

  function run() {
    document.querySelectorAll(".marquee-wrap").forEach(function (w) { enhance(w, ".product-track"); });
    document.querySelectorAll(".cat-strip").forEach(function (w) { enhance(w, ".cat-track"); });
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