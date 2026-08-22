/* ===== The Style Katha — Product detail page =====
   Reads ?id= from the URL, loads that product from Supabase and shows the
   price, description, quantity picker and an "Add to Bag" button that feeds
   the same bag used by the nav-bar cart on the home page. Related products
   from the same collection are listed underneath.
*/
(function () {
  var supabase = window.supabaseClient;
  var wrap = document.getElementById("productWrap");
  var relatedSection = document.getElementById("relatedSection");
  var relatedGrid = document.getElementById("relatedGrid");
  var crumbName = document.getElementById("crumbName");
  var crumbCat = document.getElementById("crumbCat");

  var params = new URLSearchParams(window.location.search);
  var productId = params.get("id") || "";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var DEFAULT_DESC =
    "Handpicked 1gm gold-look jewellery, finished with an anti-tarnish coat so it keeps its shine wear after wear.";
  var DEFAULT_FEATURES = [
    "1gm gold-look finish",
    "Anti-tarnish coated",
    "Skin friendly, nickel free",
    "Comes in a gift-ready box"
  ];

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

  function toast(name, price) {
    var container = document.getElementById("toastContainer");
    if (!container) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      '<div class="toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<div class="toast-body"><div class="toast-title">Added to Bag</div><div class="toast-msg">' +
      esc(name) + " — " + price + "</div></div>";
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("removing");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3200);
  }

  function detailHTML(p, catName) {
    var soldOut = p.is_active === false;
    var features = Array.isArray(p.features) && p.features.length ? p.features : DEFAULT_FEATURES;
    var old = p.old_price
      ? '<span class="pd-price-old">' + money(p.old_price) + "</span>" +
        '<span class="pd-save">Save ' + money(Number(p.old_price) - Number(p.price)) + "</span>"
      : "";
    var badge = soldOut
      ? '<span class="pd-badge">Out of Stock</span>'
      : p.badge
      ? '<span class="pd-badge">' + esc(p.badge) + "</span>"
      : "";

    return (
      '<div class="pd-media">' + badge +
        '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '">' +
      "</div>" +
      '<div class="pd-info">' +
        '<div class="pd-cat">' + esc(catName || p.category || "Jewellery") + "</div>" +
        '<h1 class="pd-name">' + esc(p.name) + "</h1>" +
        '<div class="pd-price-row"><span class="pd-price">' + money(p.price) + "</span>" + old + "</div>" +
        '<div class="pd-tax">Inclusive of all taxes</div>' +
        '<div class="pd-stock ' + (soldOut ? "out" : "in") + '">' +
          (soldOut ? "Out of stock" : "In stock — ready to ship") + "</div>" +
        '<p class="pd-desc">' + esc(p.description || DEFAULT_DESC) + "</p>" +
        '<ul class="pd-features">' +
          features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") +
        "</ul>" +
        '<div class="pd-qty-row">' +
          '<span class="pd-qty-label">Quantity</span>' +
          '<div class="pd-qty">' +
            '<button type="button" id="qtyMinus" aria-label="Decrease">−</button>' +
            '<span id="qtyValue">1</span>' +
            '<button type="button" id="qtyPlus" aria-label="Increase">+</button>' +
          "</div>" +
        "</div>" +
        '<div class="pd-actions">' +
          '<button class="pd-btn pd-btn-gold" id="addToBag"' + (soldOut ? " disabled" : "") + ">" +
            (soldOut ? "Sold Out" : "Add to Bag") + "</button>" +
          '<a class="pd-btn pd-btn-outline" href="index.html#cart">View Bag</a>' +
        "</div>" +
        '<div class="pd-meta">Free shipping on prepaid orders · Easy 3-day returns · Cash on delivery available</div>' +
      "</div>"
    );
  }

  function relatedCardHTML(p) {
    var old = p.old_price ? "<s>" + money(p.old_price) + "</s>" : "";
    return (
      '<a class="cl-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<div class="cl-media">' +
          (p.is_active === false ? '<span class="cl-tag">Out of Stock</span>' : "") +
          '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        "</div>" +
        '<h2 class="cl-name">' + esc(p.name) + "</h2>" +
        '<div class="cl-price">' + money(p.price) + old + "</div>" +
      "</a>"
    );
  }

  function wireActions(p, catName) {
    var qty = 1;
    var qtyValue = document.getElementById("qtyValue");
    var minus = document.getElementById("qtyMinus");
    var plus = document.getElementById("qtyPlus");
    var addBtn = document.getElementById("addToBag");

    if (minus) minus.addEventListener("click", function () {
      qty = Math.max(1, qty - 1); qtyValue.textContent = qty;
    });
    if (plus) plus.addEventListener("click", function () {
      qty = Math.min(99, qty + 1); qtyValue.textContent = qty;
    });
    if (addBtn) addBtn.addEventListener("click", function () {
      window.SKCart.add({
        id: p.id,
        name: p.name,
        cat: catName || p.category || "",
        price: Number(p.price) || 0,
        image: p.image_url
      }, qty);
      addBtn.textContent = "Added ✓";
      setTimeout(function () { addBtn.textContent = "Add to Bag"; }, 1400);
      toast(p.name, money(p.price));
    });
  }

  async function loadRelated(p) {
    if (!supabase) return;
    var cols = "id, name, price, old_price, badge, image_url, is_active";
    var res;
    if (p.category_id) {
      res = await supabase.from("products").select(cols + ", category_id")
        .eq("category_id", p.category_id).neq("id", p.id).limit(8);
    } else if (p.category) {
      res = await supabase.from("products").select(cols + ", category")
        .ilike("category", p.category).neq("id", p.id).limit(8);
    }
    var list = res && !res.error ? res.data || [] : [];
    if (!list.length) return;
    relatedGrid.innerHTML = list.map(relatedCardHTML).join("");
    relatedSection.hidden = false;
  }

  async function load() {
    if (!supabase || !productId) {
      wrap.innerHTML = '<div class="cl-empty">This product could not be found.</div>';
      return;
    }
    try {
      var res = await supabase
        .from("products")
        .select("id, name, price, old_price, badge, image_url, is_active, description, features, category, category_id")
        .eq("id", productId)
        .limit(1);
      if (res.error) throw res.error;
      var p = (res.data || [])[0];
      if (!p) {
        wrap.innerHTML = '<div class="cl-empty">This product could not be found.</div>';
        return;
      }

      var catName = p.category || "";
      var catSlug = "";
      if (p.category_id) {
        var cr = await supabase.from("categories").select("name, slug").eq("id", p.category_id).limit(1);
        var cat = cr.error ? null : (cr.data || [])[0];
        if (cat) { catName = cat.name; catSlug = cat.slug || ""; }
      }

      document.title = p.name + " — The Style Katha";
      crumbName.textContent = p.name;
      if (catName) {
        crumbCat.textContent = catName;
        crumbCat.href = catSlug ? "collection.html?slug=" + encodeURIComponent(catSlug) : "index.html";
      } else {
        crumbCat.textContent = "Collection";
        crumbCat.href = "index.html";
      }

      wrap.innerHTML = detailHTML(p, catName);
      wireActions(p, catName);
      loadRelated(p);
    } catch (e) {
      console.error("Product page error:", e);
      wrap.innerHTML = '<div class="cl-empty">Something went wrong loading this product.</div>';
    }
  }

  load();
})();
