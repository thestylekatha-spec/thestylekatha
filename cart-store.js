/* ===== The Style Katha — shared bag store =====
   Keeps the bag in localStorage so the nav-bar bag on the home page and the
   "Add to Bag" buttons on collection / product pages stay in sync.
*/
(function () {
  var KEY = "sk_cart_v1";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list || []));
    } catch (e) {}
    document.dispatchEvent(new CustomEvent("sk:cart-change", { detail: list || [] }));
  }

  window.SKCart = {
    key: KEY,
    get: read,
    set: write,
    count: function () {
      return read().reduce(function (n, i) { return n + (i.qty || 1); }, 0);
    },
    add: function (item, qty) {
      var list = read();
      var q = Math.max(1, parseInt(qty || 1, 10));
      var found = null;
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === String(item.id)) { found = list[i]; break; }
      }
      if (found) found.qty = (found.qty || 1) + q;
      else list.push({
        id: item.id,
        name: item.name,
        cat: item.cat || "",
        price: Number(item.price) || 0,
        image: item.image || "",
        qty: q
      });
      write(list);
      return list;
    },
    clear: function () { write([]); }
  };

  /* Paint any [data-bag-count] badge on pages without the full cart drawer. */
  function paint() {
    var n = window.SKCart.count();
    Array.prototype.forEach.call(document.querySelectorAll("[data-bag-count]"), function (el) {
      el.textContent = n;
    });
  }
  document.addEventListener("sk:cart-change", paint);
  window.addEventListener("storage", paint);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
