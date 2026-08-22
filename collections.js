/* ===== The Style Katha — Collections (admin-driven) =====
   Loads categories + their products from Supabase and renders an infinite
   scrolling marquee of PRODUCT CARDS (not just categories). Each card has
   an Add to Cart button. Clicking the category name navigates to collection.html.
   Include AFTER main.js:  <script src="collections.js"></script>
 */
(function () {
  var FALLBACK_IMG = "assets/collections/ring.jpg";
  var MAX_PRODUCTS_PER_CAT = 12;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """")
      .replace(/'/g, "'");
  }

  function money(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function cover(c) {
    return c.icon || c.image_url || FALLBACK_IMG;
  }

  function catHref(c) {
    return "collection.html?slug=" + encodeURIComponent(c.slug || c.id);
  }

  function productCardHTML(p, cat) {
    var badgeHtml = p.badge
      ? '<span class="badge' + (p.badgeAlt ? ' alt' : '') + '">' + esc(p.badge) + '</span>'
      : '';
    var oldPriceHtml = p.old_price
      ? '<span class="price-old">' + money(p.old_price) + '</span>'
      : '';
    var imgSrc = p.image_url || FALLBACK_IMG;
    var filterCat = p.category_id || p.category || cat.id;
    return (
      '<div class="collection-product-card reveal-scale" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" data-cat="' + esc(filterCat) + '" data-price="' + esc(p.price) + '" data-desc="' + esc(p.description || '') + '" data-features=\'' + esc(JSON.stringify(p.features || [])) + '\'>' +
        '<div class="collection-card-media">' +
          badgeHtml +
          '<img src="' + esc(imgSrc) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="collection-card-body">' +
          '<div class="collection-card-cat">' + esc(cat.name) + '</div>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<div class="collection-price-row"><span class="collection-price">' + money(p.price) + '</span>' + oldPriceHtml + '</div>' +
          '<button class="collection-add-btn" data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '" data-cat="' + esc(filterCat) + '" data-price="' + esc(p.price) + '" data-image="' + esc(imgSrc) + '">Add to Cart</button>' +
        '</div>' +
      '</div>'
    );
  }

  function categorySectionHTML(cat, products) {
    var heading =
      '<div class="collection-cat-section">' +
        '<a href="' + catHref(cat) + '" class="collection-cat-heading">' +
          '<img src="' + esc(cover(cat)) + '" alt="' + esc(cat.name) + '" class="collection-cat-icon">' +
          '<span>' + esc(cat.name.toUpperCase()) + '</span>' +
        '</a>' +
      '</div>';

    if (!products.length) {
      return heading +
        '<div class="collection-empty">No products in this collection yet.</div>';
    }

    var list = products.slice(0, MAX_PRODUCTS_PER_CAT);
    var cardW = (window.innerWidth || 1200) < 640 ? 160 : 220;
    var vw = window.innerWidth || 1200;
    var repeats = Math.max(1, Math.ceil(vw / Math.max(1, list.length * cardW)));
    var one = "";
    for (var r = 0; r < repeats; r++) one += list.map(function(p){ return productCardHTML(p, cat); }).join("");

    return (
      heading +
      '<div class="marquee-wrap collection-marquee">' +
        '<div class="collection-track">' + one + "</div>" +
        '<div aria-hidden="true" class="collection-track">' + one + "</div>" +
      "</div>"
    );
  }

  function fill(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function render(cats) {
    var catsEl = document.getElementById("collectionsTrack");
    console.log("Collections render called, cats:", cats.length, "container:", !!catsEl);
    if (!catsEl) return;

    if (!cats.length) {
      fill("collectionsTrack", '<div style="padding:20px;font-size:13px;color:#7a6f65;">No collections yet. Add categories in admin.</div>');
      return;
    }

    // For each category, load its products and build the section
    var sectionsHtml = "";
    var pending = cats.length;
    var results = {};

    cats.forEach(function(cat, idx) {
      loadProductsForCat(cat).then(function(products) {
        results[idx] = { cat: cat, products: products };
        pending--;
        if (pending === 0) {
          // Render in original category order
          for (var i = 0; i < cats.length; i++) {
            sectionsHtml += categorySectionHTML(results[i].cat, results[i].products);
          }
          fill("collectionsTrack", sectionsHtml);
          bindAddToCartButtons();
          enhanceMarquees();
          if (typeof window.initReveal === "function") window.initReveal();
        }
      });
    });
  }

  function loadProductsForCat(cat) {
    if (!window.supabaseClient) return Promise.resolve([]);
    var cols = "id, name, price, old_price, badge, badge_alt, image_url, is_active, category, category_id, description, features";
    return window.supabaseClient
      .from("products")
      .select(cols)
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(MAX_PRODUCTS_PER_CAT)
      .then(function(res) {
        if (res.error) throw res.error;
        var list = res.data || [];
        // Fallback for older rows that only store the category name
        if (!list.length) {
          return window.supabaseClient
            .from("products")
            .select(cols)
            .ilike("category", cat.name)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(MAX_PRODUCTS_PER_CAT)
            .then(function(alt) { return alt.error ? [] : (alt.data || []); });
        }
        return list;
      })
      .catch(function(e) {
        console.warn("Collections: could not load products for " + cat.name, e);
        return [];
      });
  }

  function bindAddToCartButtons() {
    document.querySelectorAll('.collection-add-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var name = btn.getAttribute('data-name');
        var cat = btn.getAttribute('data-cat');
        var price = parseInt(btn.getAttribute('data-price'), 10);
        var image = btn.getAttribute('data-image');

        if (window.cartActions && window.cartActions.addItem) {
          window.cartActions.addItem({ id: id, name: name, cat: cat, price: price, image: image, qty: 1 });
        } else {
          // Fallback: trigger the add-to-cart logic from main.js
          var event = new CustomEvent('sk:addToCart', { detail: { id: id, name: name, cat: cat, price: price, image: image, qty: 1 } });
          window.dispatchEvent(event);
        }

        var original = btn.textContent;
        btn.textContent = 'Added ✓';
        btn.disabled = true;
        setTimeout(function(){ btn.textContent = original; btn.disabled = false; }, 1200);
      });
    });
  }

  function enhanceMarquees() {
    if (enhanceMarquees._bound) return;
    enhanceMarquees._bound = true;

    document.querySelectorAll('.collection-marquee').forEach(function(wrap) {
      var tracks = wrap.querySelectorAll('.collection-track');
      var paused = false;

      wrap.addEventListener('mouseenter', function(){ paused = true; tracks.forEach(function(t){ t.style.animationPlayState = 'paused'; }); });
      wrap.addEventListener('mouseleave', function(){ paused = false; tracks.forEach(function(t){ t.style.animationPlayState = 'linear'; }); });

      wrap.addEventListener('touchstart', function(){ paused = true; tracks.forEach(function(t){ t.style.animationPlayState = 'paused'; }); }, { passive: true });
      var resumeTimer;
      var resume = function(){
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function(){
          paused = false;
          tracks.forEach(function(t){ t.style.animationPlayState = 'linear'; });
        }, 1200);
      };
      wrap.addEventListener('touchend', resume, { passive: true });
      wrap.addEventListener('touchcancel', resume, { passive: true });
    });
  }

  async function load() {
    var cats = [];
    try {
      console.log("Collections: supabaseClient available?", !!window.supabaseClient);
      if (window.supabaseClient) {
        var res = await window.supabaseClient
          .from("categories")
          .select("id, name, slug, icon, image_url, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        console.log("Categories query result:", res);
        if (res.error) throw res.error;
        cats = res.data || [];
        console.log("Categories loaded:", cats.length);
      } else {
        console.warn("Collections: supabaseClient not available");
      }
    } catch (e) {
      console.error("Collections: error loading categories:", e);
    }
    window.SK_COLLECTIONS = cats;
    render(cats);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();