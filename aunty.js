// Reveal-on-scroll (iOS-safe: falls back to instantly visible if
// IntersectionObserver is unavailable or throws, otherwise sections
// would stay stuck at opacity:0 on older iPhones/iPads).
(function () {
  var els = document.querySelectorAll('.ak .reveal, .ak .reveal-stagger');

  function showAll() {
    els.forEach(function (el) { el.classList.add('visible'); });
  }

  if (typeof IntersectionObserver === 'undefined') { showAll(); return; }

  try {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });

    // Safety net (iOS sometimes reports 0-size rects during load):
    // after 2s, force-show anything still hidden that's near the viewport.
    setTimeout(function () {
      els.forEach(function (el) {
        if (el.classList.contains('visible')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 200) el.classList.add('visible');
      });
    }, 2000);
  } catch (e) {
    showAll();
  }
})();

