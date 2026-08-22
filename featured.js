/* ===== The Style Katha — Featured category rows (admin-driven) =====
   Renders ONE scrolling marquee row per active category, straight from
   Supabase (order = sort_order). Add/rename/reorder categories in
   admin.html and the homepage rows update automatically — no hardcoded
   list here. Categories with no products are skipped.

   Include AFTER collections.js:  <script src="featured.js"></script>
*/
(function () {
  var MOUNT_ID = "featuredCategories";
  var MAX_PER_ROW = 20;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return "Rs. " + Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function cardHTML(p) {
    return (
      '<a class="product-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="thumb"><img alt="' + esc(p.name) + '" src="' + esc(p.image_url) + '" loading="lazy"/></div>' +
        '<div class="name">' + esc(p.name) + "</div>" +
        '<div class="price">' + money(p.price) + "</div>" +
      "</a>"
    );
  }

  function sectionHTML(row, cat, products, isFirst) {
    var href = cat ? "collection.html?slug=" + encodeURIComponent(cat.slug || cat.id) : "#";
    var title = cat ? String(cat.name).toUpperCase() : row.title;
    var heading =
      '<section class="ak-hero reveal"' + (isFirst ? "" : ' style="padding-top:10px;"') + ">" +
        "<h1" + (isFirst ? "" : ' style="font-size:30px;"') + ">" + esc(title) + "</h1>" +
        '<a class="shop-now" href="' + href + '">Shop Now</a>' +
      "</section>";

    if (!products.length) {
      return (
        heading +
        '<section class="product-section">' +
          '<div style="padding:18px 20px;font-size:13px;color:#7a6f65;text-align:center;">' +
            "No products in this collection yet." +
          "</div>" +
        "</section>"
      );
    }

    var list = products.slice(0, MAX_PER_ROW);
    // Repeat the set until one track is wider than the screen, otherwise the
    // -100% marquee shift leaves a visible gap on narrow (mobile) viewports.
    var cardW = (window.innerWidth || 1200) < 640 ? 180 : 276;
    var vw = window.innerWidth || 1200;
    var repeats = Math.max(1, Math.ceil(vw / Math.max(1, list.length * cardW)));
    var one = "";
    for (var r = 0; r < repeats; r++) one += list.map(cardHTML).join("");

    return (
      heading +
      '<section class="product-section">' +
        '<div class="marquee-wrap">' +
          '<div class="product-track">' + one + "</div>" +
          '<div aria-hidden="true" class="product-track">' + one + "</div>" +
        "</div>" +
      "</section>"
    );
  }


  async function loadCategories() {
    if (Array.isArray(window.SK_COLLECTIONS) && window.SK_COLLECTIONS.length) {
      return window.SK_COLLECTIONS;
    }
    if (!window.supabaseClient) return [];
    var res = await window.supabaseClient
      .from("categories")
      .select("id, name, slug, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (res.error) throw res.error;
    return res.data || [];
  }

  async function loadProducts(cat) {
    var sb = window.supabaseClient;
    if (!sb || !cat) return [];
    var cols = "id, name, price, old_price, badge, image_url, is_active, in_stock, category, category_id";
    var res = await sb
      .from("products")
      .select(cols)
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(MAX_PER_ROW);
    var list = res.error ? [] : res.data || [];

    // Fallback for older rows that only store the category name.
    if (!list.length) {
      var alt = await sb
        .from("products")
        .select(cols)
        .ilike("category", cat.name)
        .eq("is_active", true)
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(MAX_PER_ROW);
      if (!alt.error) list = alt.data || [];
    }
    return list.filter(function (p) { return p && p.image_url; });
  }

  /* Every active category from Supabase gets its own marquee row on the
     homepage, in sort_order — no hardcoded list. Categories with no
     products are skipped entirely so empty sections never show. */
  async function init() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;

    var cats = [];
    try {
      cats = await loadCategories();
    } catch (e) {
      console.warn("Featured rows: could not load categories.", e);
    }

    var sections = [];
    for (var i = 0; i < cats.length; i++) {
      var products = [];
      try {
        products = await loadProducts(cats[i]);
      } catch (e) {
        console.warn("Featured rows: could not load products for", cats[i].name, e);
      }
      products = products.filter(function (p) { return p && p.image_url; });
      if (!products.length) continue; // skip empty categories
      sections.push(sectionHTML(cats[i], cats[i], products, sections.length === 0));
    }

    if (!sections.length) {
      mount.className = "ak";
      mount.innerHTML = "";
      return;
    }

    mount.className = "ak";
    mount.innerHTML = sections.join("");
    enhanceMarquees(mount);

    /* aunty.css hides .ak .reveal until it gets .visible (its own observer
       only runs once at page load, before these rows exist), while
       main.js's initReveal adds .in. Add .visible ourselves so the
       section headings ("NECKLACES", "BRACELETS", ...) actually show up. */
    Array.prototype.forEach.call(mount.querySelectorAll(".reveal"), function (el) {
      el.classList.add("visible");
    });

    // Ensure reveal animations work for newly injected content
    setTimeout(function() {
      if (typeof window.initReveal === "function") window.initReveal();
      // re-assert visibility in case initReveal resets anything
      Array.prototype.forEach.call(mount.querySelectorAll(".reveal"), function (el) {
        el.classList.add("visible");
      });
    }, 0);
  }

  /* Touch friendliness: pause while the finger is down, resume after, and
     re-render on orientation change so the track still covers the screen. */
  function enhanceMarquees(mount) {
    var wraps = mount.querySelectorAll(".marquee-wrap");
    Array.prototype.forEach.call(wraps, function (w) {
      var resume;
      w.addEventListener("touchstart", function () {
        clearTimeout(resume);
        w.classList.add("is-paused");
      }, { passive: true });
      var release = function () {
        clearTimeout(resume);
        resume = setTimeout(function () { w.classList.remove("is-paused"); }, 1200);
      };
      w.addEventListener("touchend", release, { passive: true });
      w.addEventListener("touchcancel", release, { passive: true });
    });

    if (enhanceMarquees._bound) return;
    enhanceMarquees._bound = true;
    var lastW = window.innerWidth;
    var t;
    window.addEventListener("resize", function () {
      if (Math.abs(window.innerWidth - lastW) < 120) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(init, 250);
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
