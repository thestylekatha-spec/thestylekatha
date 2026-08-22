/* ===== The Style Katha — Collections (admin-driven) =====
   Loads categories created in admin.html from Supabase and renders:
     1) the dark scrolling category strip  (#catTrack / #catTrackClone)
     2) the round "Our Collections" marquee (#collectionsTrack / clone)
   Clicking any of them opens collection.html?slug=<slug> which lists all
   products of that collection.
   Include AFTER main.js:  <script src="collections.js"></script>
*/
(function () {
  var FALLBACK_IMG = "assets/collections/ring.jpg";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cover(c) {
    return c.icon || c.image_url || FALLBACK_IMG;
  }

  function href(c) {
    return "collection.html?slug=" + encodeURIComponent(c.slug || c.id);
  }

  function stripItem(c) {
    return (
      '<a class="cat-item" href="' + href(c) + '">' +
        '<img src="' + esc(cover(c)) + '" alt="' + esc(c.name) + '" loading="lazy">' +
        "<span>" + esc(c.name) + "</span>" +
      "</a>"
    );
  }

  function circleItem(c) {
    return (
      '<a class="collection-item" href="' + href(c) + '">' +
        '<img src="' + esc(cover(c)) + '" alt="' + esc(c.name) + '" loading="lazy">' +
        '<div class="label">' + esc(c.name) + "</div>" +
      "</a>"
    );
  }

  function fill(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function render(cats) {
    if (!cats.length) {
      fill("catTrack", "");
      fill("catTrackClone", "");
      var row = document.getElementById("collectionsTrack");
      if (row) {
        row.innerHTML =
          '<div style="padding:20px;font-size:13px;color:#7a6f65;">No collections yet. Add categories in admin.</div>';
      }
      fill("collectionsTrackClone", "");
      return;
    }

    var strip = cats.map(stripItem).join("");
    var circles = cats.map(circleItem).join("");
    fill("catTrack", strip);
    fill("catTrackClone", strip);
    fill("collectionsTrack", circles);
    fill("collectionsTrackClone", circles);

    if (typeof window.initReveal === "function") window.initReveal();
  }

  async function load() {
    var cats = [];
    try {
      if (window.supabaseClient) {
        var res = await window.supabaseClient
          .from("categories")
          .select("id, name, slug, icon, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (res.error) throw res.error;
        cats = res.data || [];
      }
    } catch (e) {
      console.warn("Collections: could not load from Supabase.", e);
    }
    window.SK_COLLECTIONS = cats;
    render(cats);
    renderFooterLinks(cats);
  }

  /* Footer "Collection" list — same categories, linked to their pages */
  function renderFooterLinks(cats) {
    var ul = document.getElementById("footerCollectionLinks");
    if (!ul) return;
    if (!cats.length) {
      ul.innerHTML = "";
      return;
    }
    ul.innerHTML = cats.map(function (c) {
      return '<li><a href="' + href(c) + '">' + esc(c.name) + "</a></li>";
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
