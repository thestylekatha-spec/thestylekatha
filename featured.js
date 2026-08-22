/* ===== The Style Katha — Featured category rows (admin-driven) =====
   Renders the three homepage category rows (Necklaces, Bracelets, Temple
   Jewellery) from the products you add in admin.html. Markup + classes are
   identical to the old hard-coded HTML, so the marquee animation, reveal
   effect and card styling stay exactly the same.

   Include AFTER collections.js:  <script src="featured.js"></script>
 */
(function () {
  var MOUNT_ID = "featuredCategories";
  var MAX_PER_ROW = 10;

  /* Which rows to show, in order. match values are compared (lowercase,
     ignoring spaces/dashes) against the category slug and name coming from
     the admin panel. Edit this list to change the homepage rows. */
  var ROWS = [
    { title: "NECKLACES", match: ["necklaces", "necklace"] },
    { title: "BRACELETS", match: ["bracelets", "bracelet"] },
    { title: "TEMPLE JEWELLERY", match: ["templejewellery", "templejewelry", "temple"] }
  ];

function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """")
      .replace(/'/g, "'");
  }

  function money(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function cardHTML(p) {
    return (
      '<div class="product-card">' +
        '<div class="thumb"><img alt="' + esc(p.name) + '" src="' + esc(p.image_url) + '" loading="lazy"/></div>' +
        '<div class="name">' + esc(p.name) + "</div>" +
        '<div class="price">' + money(p.price) + "</div>" +
      "</div>"
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


  function pickCategory(cats, row) {
    var wanted = row.match.map(norm);
    for (var i = 0; i < wanted.length; i++) {
      for (var j = 0; j < cats.length; j++) {
        if (norm(cats[j].slug) === wanted[i] || norm(cats[j].name) === wanted[i]) return cats[j];
      }
    }
    // looser: category name/slug contains the keyword
    for (var k = 0; k < cats.length; k++) {
      for (var m = 0; m < wanted.length; m++) {
        if (norm(cats[k].name).indexOf(wanted[m]) > -1 || norm(cats[k].slug).indexOf(wanted[m]) > -1) {
          return cats[k];
        }
      }
    }
    return null;
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
    var cols = "id, name, price, old_price, badge, image_url, is_active, category, category_id";
    var res = await sb
      .from("products")
      .select(cols)
      .eq("category_id", cat.id)
      .eq("is_active", true)
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
        .order("created_at", { ascending: false })
        .limit(MAX_PER_ROW);
      if (!alt.error) list = alt.data || [];
    }
    return list.filter(function (p) { return p && p.image_url; });
  }

  var cachedData = null;

  async function loadAndCacheData() {
    var cats = [];
    try {
      cats = await loadCategories();
    } catch (e) {
      console.warn("Featured rows: could not load categories.", e);
    }

    var rows = [];
    for (var i = 0; i < ROWS.length; i++) {
      var cat = pickCategory(cats, ROWS[i]);
      var products = [];
      try {
        products = await loadProducts(cat);
      } catch (e) {
        console.warn("Featured rows: could not load products.", e);
      }
      rows.push({ row: ROWS[i], cat: cat, products: products });
    }
    cachedData = rows;
    return rows;
  }

  function renderRows(mount, rows) {
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      html += sectionHTML(rows[i].row, rows[i].cat, rows[i].products, i === 0);
    }
    mount.className = "ak";
    mount.innerHTML = html;
    enhanceMarquees(mount);
    if (typeof window.initReveal === "function") window.initReveal();
  }

  async function init() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) return;

    var rows = await loadAndCacheData();
    renderRows(mount, rows);

    var tries = 0;
    (function reveal() {
      if (typeof window.initReveal === "function") { window.initReveal(); return; }
      if (tries++ < 20) setTimeout(reveal, 200);
    })();
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
      t = setTimeout(function(){
        var mount = document.getElementById(MOUNT_ID);
        if (mount && cachedData) renderRows(mount, cachedData);
      }, 300);
    });
  }


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
