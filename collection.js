/* ===== The Style Katha — Collection page =====
   Reads ?slug= (or ?id=) from the URL, loads that category from Supabase and
   lists every product belonging to it. Products with is_active = false get an
   "Out of Stock" badge.
*/
(function () {
  var supabase = window.supabaseClient;
  var grid = document.getElementById("collectionGrid");
  var titleEl = document.getElementById("collectionTitle");
  var crumbEl = document.getElementById("crumbName");
  var descEl = document.getElementById("collectionDesc");
  var sortEl = document.getElementById("sortBy");
  var products = [];

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug") || "";
  var catId = params.get("id") || "";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function setHeading(name, description) {
    var label = name || "Collection";
    titleEl.textContent = label.toUpperCase();
    crumbEl.textContent = label;
    document.title = label + " — The Style Katha";
    if (description) descEl.textContent = description;
  }

  function cardHTML(p) {
    var soldOut = p.is_active === false;
    var tag = soldOut
      ? '<span class="cl-tag">Out of Stock</span>'
      : p.badge
      ? '<span class="cl-tag sale">' + esc(p.badge) + "</span>"
      : "";
    var old = p.old_price ? "<s>" + money(p.old_price) + "</s>" : "";
    return (
      '<article class="cl-card">' +
        '<div class="cl-media">' + tag +
          '<img src="' + esc(p.image_url) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        "</div>" +
        '<h2 class="cl-name">' + esc(p.name) + "</h2>" +
        '<div class="cl-price">' + money(p.price) + old + "</div>" +
      "</article>"
    );
  }

  function sorted(list) {
    var arr = list.slice();
    switch (sortEl.value) {
      case "price-asc": arr.sort(function (a, b) { return a.price - b.price; }); break;
      case "price-desc": arr.sort(function (a, b) { return b.price - a.price; }); break;
      case "name-asc": arr.sort(function (a, b) { return String(a.name).localeCompare(b.name); }); break;
      case "name-desc": arr.sort(function (a, b) { return String(b.name).localeCompare(a.name); }); break;
    }
    return arr;
  }

  function render() {
    if (!products.length) {
      grid.innerHTML = '<div class="cl-empty">No products in this collection yet.</div>';
      return;
    }
    grid.innerHTML = sorted(products).map(cardHTML).join("");
  }

  sortEl.addEventListener("change", render);

  document.getElementById("viewGrid").addEventListener("click", function () {
    grid.classList.remove("list");
    this.classList.add("active");
    document.getElementById("viewList").classList.remove("active");
  });
  document.getElementById("viewList").addEventListener("click", function () {
    grid.classList.add("list");
    this.classList.add("active");
    document.getElementById("viewGrid").classList.remove("active");
  });

  async function load() {
    if (!supabase) {
      grid.innerHTML = '<div class="cl-empty">Could not connect to the store.</div>';
      return;
    }
    try {
      var category = null;
      var q = supabase.from("categories").select("id, name, slug, description");
      var res = slug ? await q.eq("slug", slug).limit(1) : await q.eq("id", catId).limit(1);
      if (res.error) throw res.error;
      category = (res.data || [])[0] || null;

      if (!category) {
        setHeading(slug || catId || "Collection", "");
        grid.innerHTML = '<div class="cl-empty">This collection could not be found.</div>';
        return;
      }

      setHeading(category.name, category.description || "");

      var pr = await supabase
        .from("products")
        .select("id, name, price, old_price, badge, image_url, is_active, category_id")
        .eq("category_id", category.id)
        .order("created_at", { ascending: true });
      if (pr.error) throw pr.error;
      products = pr.data || [];

      // Fallback: older products may only carry the category name, not the id.
      if (!products.length) {
        var alt = await supabase
          .from("products")
          .select("id, name, price, old_price, badge, image_url, is_active, category")
          .ilike("category", category.name)
          .order("created_at", { ascending: true });
        if (!alt.error) products = alt.data || [];
      }

      render();
    } catch (e) {
      console.error("Collection page error:", e);
      grid.innerHTML = '<div class="cl-empty">Something went wrong loading this collection.</div>';
    }
  }

  load();
})();
