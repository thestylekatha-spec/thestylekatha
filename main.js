    // Use shared config
    var supabase = window.supabaseClient;
    var WHATSAPP_NUMBER = window.SITE_CONFIG.whatsapp.number;
    var SUPABASE_URL = window.SITE_CONFIG.supabase.url;

    function generateOrderId(){
      var now = new Date();
      var datePart = String(now.getFullYear()).slice(2) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      var randPart = Math.floor(1000 + Math.random() * 9000);
      return 'SK' + datePart + '-' + randPart;
    }

    async function showOrderReceipt(data){
      var modal = document.getElementById('receiptModal');
      var body = document.getElementById('receiptBody');
      var phone = '+91 123456789';
      try {
        if (supabase) {
          var r = await supabase.from('site_settings').select('phone_display, phone').eq('id', 'main').single();
          if (r.data) phone = r.data.phone_display || r.data.phone || phone;
        }
      } catch(e) {}
      var itemsHtml = data.items.map(function(item){
        return '<div class="receipt-item">' +
          '<span class="receipt-item-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="receipt-item-qty">x' + item.qty + '</span>' +
          '<span class="receipt-item-price">' + fmtPrice(item.price * item.qty) + '</span>' +
        '</div>';
      }).join('');

      var customer = data.customer;
      body.innerHTML =
        '<div class="receipt-row"><span class="label">Order ID</span><span class="value">' + escapeHtml(data.orderId) + '</span></div>' +
        '<div class="receipt-row"><span class="label">Date</span><span class="value">' + escapeHtml(data.date) + '</span></div>' +
        '<div class="receipt-divider"></div>' +
        '<div class="receipt-row label">Items</div>' +
        itemsHtml +
        '<div class="receipt-divider"></div>' +
        '<div class="receipt-row receipt-total"><span>Total</span><span class="amt">' + fmtPrice(data.total) + '</span></div>' +
        '<div class="receipt-divider"></div>' +
        '<div class="receipt-row label">Shipping To</div>' +
        '<div style="text-align:left; font-size:13px; color:var(--ink); line-height:1.6;">' +
          escapeHtml(customer.name) + '<br>' +
          escapeHtml(customer.mobile) + (customer.altMobile ? ' / ' + escapeHtml(customer.altMobile) : '') + '<br>' +
          escapeHtml(customer.address) + '<br>' +
          escapeHtml(customer.mandal) + ', ' + escapeHtml(customer.district) +
        '</div>' +
        '<div class="receipt-note">' +
          '<strong>Need help?</strong> If you don\'t hear from us within 24 hours, please call or WhatsApp us at <strong>' + phone + '</strong> with your Order ID.'
        '</div>';

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Close handlers
      var closeFn = function(){
        modal.style.display = 'none';
        document.body.style.overflow = '';
      };
      document.getElementById('receiptClose').onclick = closeFn;
      document.getElementById('receiptOverlay').onclick = closeFn;
      document.getElementById('closeReceiptBtn').onclick = closeFn;

      // Download receipt as PDF
      document.getElementById('downloadReceipt').onclick = function(){
        var jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
        if (!jsPDF) {
          alert('PDF library is still loading. Please try again in a moment.');
          return;
        }
        var doc = new jsPDF({ unit: 'mm', format: 'a4' });
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();
        var m = 18;
        var y = 0;

        function pdfPrice(n){
          return 'Rs. ' + Number(n).toLocaleString('en-IN');
        }
        var receiptPhone = phone;

        // ---- Background ----
        doc.setFillColor(245, 239, 226);
        doc.rect(0, 0, pw, ph, 'F');

        // ---- Top gold accent bar ----
        doc.setFillColor(201, 163, 92);
        doc.rect(0, 0, pw, 3, 'F');

        // ---- Header with logo ----
        y = 10;
        try {
          doc.addImage('assets/logo.png', 'PNG', pw / 2 - 15, y, 30, 30);
        } catch(e) {}
        y += 34;

        doc.setTextColor(40, 34, 26);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('THE STYLE KATHA', pw / 2, y, { align: 'center' });
        y += 5;
        doc.setFontSize(7);
        doc.setTextColor(140, 130, 115);
        doc.setFont('helvetica', 'normal');
        doc.text('Luxury Jewellery  |  Antwerp  |  www.thestylekatha.com', pw / 2, y, { align: 'center' });
        y += 4;
        doc.text(receiptPhone, pw / 2, y, { align: 'center' });

        y += 8;

        // ---- Order badge ----
        doc.setFillColor(201, 163, 92);
        doc.roundedRect(m, y, pw - 2 * m, 10, 2, 2, 'F');
        doc.setTextColor(40, 34, 26);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDER CONFIRMED', pw / 2, y + 7, { align: 'center' });

        y += 16;

        // ---- Order info cards ----
        var colW = (pw - 2 * m - 6) / 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(m, y, colW, 14, 2, 2, 'F');
        doc.roundedRect(m + colW + 6, y, colW, 14, 2, 2, 'F');

        doc.setFontSize(7);
        doc.setTextColor(140, 130, 115);
        doc.setFont('helvetica', 'normal');
        doc.text('ORDER ID', m + 4, y + 5);
        doc.text('DATE', m + colW + 10, y + 5);

        doc.setFontSize(10);
        doc.setTextColor(40, 34, 26);
        doc.setFont('helvetica', 'bold');
        doc.text(data.orderId, m + 4, y + 11);
        doc.setFont('helvetica', 'normal');
        doc.text(data.date, m + colW + 10, y + 11);

        y += 20;

        // ---- Items table ----
        doc.setFillColor(236, 227, 207);
        doc.roundedRect(m, y, pw - 2 * m, 8, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(80, 70, 55);
        doc.setFont('helvetica', 'bold');
        doc.text('ITEM', m + 4, y + 5.5);
        doc.text('QTY', pw - m - 32, y + 5.5);
        doc.text('AMOUNT', pw - m - 4, y + 5.5, { align: 'right' });

        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        data.items.forEach(function(item, i){
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255);
            doc.rect(m, y - 4, pw - 2 * m, 8, 'F');
          }
          doc.setTextColor(40, 34, 26);
          var name = item.name.length > 28 ? item.name.substring(0, 26) + '..' : item.name;
          doc.text(name, m + 4, y + 1);
          doc.setTextColor(140, 130, 115);
          doc.text('x' + item.qty, pw - m - 32, y + 1);
          doc.setTextColor(40, 34, 26);
          doc.text(pdfPrice(item.price * item.qty), pw - m - 4, y + 1, { align: 'right' });
          y += 8;
        });

        // ---- Total bar ----
        y += 2;
        doc.setFillColor(40, 34, 26);
        doc.roundedRect(m, y, pw - 2 * m, 10, 2, 2, 'F');
        doc.setTextColor(201, 163, 92);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL', m + 4, y + 7);
        doc.text(pdfPrice(data.total), pw - m - 4, y + 7, { align: 'right' });

        y += 16;

        // ---- Shipping card ----
        var shipH = 34;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(m, y, pw - 2 * m, shipH, 2, 2, 'F');

        doc.setFillColor(201, 163, 92);
        doc.roundedRect(m, y, 3, shipH, 1, 1, 'F');

        doc.setFontSize(8);
        doc.setTextColor(201, 163, 92);
        doc.setFont('helvetica', 'bold');
        doc.text('SHIPPING TO', m + 8, y + 6);

        doc.setFontSize(9);
        doc.setTextColor(40, 34, 26);
        doc.setFont('helvetica', 'normal');
        var phone = customer.mobile + (customer.altMobile ? ' / ' + customer.altMobile : '');
        doc.text(customer.name, m + 8, y + 12);
        doc.setTextColor(100, 90, 75);
        doc.text(phone, m + 8, y + 17);
        doc.text(customer.address, m + 8, y + 22);
        doc.text(customer.mandal + ', ' + customer.district, m + 8, y + 27);

        y += shipH + 8;

        // ---- Help note ----
        doc.setFillColor(236, 227, 207);
        doc.roundedRect(m, y, pw - 2 * m, 12, 2, 2, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 90, 75);
        doc.setFont('helvetica', 'normal');
        doc.text('Need help? Contact ' + receiptPhone + ' with your Order ID.', pw / 2, y + 7.5, { align: 'center' });

        // ---- Bottom gold bar ----
        doc.setFillColor(201, 163, 92);
        doc.rect(0, ph - 3, pw, 3, 'F');

        // ---- Footer ----
        doc.setFontSize(6.5);
        doc.setTextColor(160, 150, 135);
        doc.text('Thank you for your order!  |  The Style Katha  |  thestylekatha.com', pw / 2, ph - 7, { align: 'center' });

        doc.save('receipt-' + data.orderId + '.pdf');
      };
    }

    // ---- Collection rendering (loads live from Supabase "products" table) ----
    var DEFAULT_DESC = '';
    var DEFAULT_FEATURES = [];
    var SITE_PHONE = '+91 123456789';

    function escapeHtml(str){
      return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
      });
    }

    function fmtPrice(n){
      return '₹' + Number(n).toLocaleString('en-IN');
    }

    // Normalizes a Supabase product row (snake_case columns) into the shape
    // productCardHTML expects (camelCase, plus a resolved image URL).
    function normalizeProduct(row){
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        category_id: row.category_id,
        price: row.price,
        oldPrice: row.old_price,
        badge: row.badge,
        badgeAlt: row.badge_alt,
        image: row.image_url,
        description: row.description || '',
        features: row.features || []
      };
    }

    function productCardHTML(p){
      var badgeHtml = p.badge
        ? '<span class="badge' + (p.badgeAlt ? ' alt' : '') + '">' + escapeHtml(p.badge) + '</span>'
        : '';
      var oldPriceHtml = p.oldPrice
        ? '<span class="price-old">' + fmtPrice(p.oldPrice) + '</span>'
        : '';
      // Keep local asset paths and remote URLs intact. Never embed image data in HTML.
      var imgSrc = p.image;
      var filterCat = p.category_id || p.category; // use category_id for filtering if available
      return (
        '<div class="card reveal-scale" data-id="' + escapeHtml(p.id) + '" data-name="' + escapeHtml(p.name) + '" data-cat="' + escapeHtml(filterCat) + '" data-price="' + escapeHtml(p.price) + '" data-desc="' + escapeHtml(p.description || DEFAULT_DESC) + '" data-features=\'' + escapeHtml(JSON.stringify(p.features || DEFAULT_FEATURES)) + '\'>' +
          '<div class="card-media">' +
            badgeHtml +
            '<img src="' + imgSrc + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="cat">' + escapeHtml(p.category) + '</div>' +
            '<h3>' + escapeHtml(p.name) + '</h3>' +
            '<div class="price-row"><span class="price">' + fmtPrice(p.price) + '</span>' + oldPriceHtml + '</div>' +
            '<button class="add-btn">Add to Cart</button>' +
          '</div>' +
        '</div>'
      );
    }

    // Category state
    var categories = [];
    var currentCategoryFilter = 'all';

    // Load categories from Supabase
    async function loadCategories(){
      try {
        if (!supabase) throw new Error('Supabase not initialized');
        var result = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (result.error) throw result.error;
        categories = result.data || [];
        renderCategoryFilter();
      } catch (e) {
        console.warn('Could not load categories:', e);
        categories = [];
        renderCategoryFilter();
      }
    }

    function renderCategoryFilter(){
      var filterEl = document.getElementById('categoryFilter');
      if (!filterEl) return;
      var buttons = '<button class="cat-btn' + (currentCategoryFilter === 'all' ? ' active' : '') + '" data-cat="all"><span class="cat-icon">✦</span>All</button>';
      buttons += categories.map(function(cat){
        var isActive = currentCategoryFilter === cat.id;
        var iconHtml = cat.icon ? '<img src="' + cat.icon + '" class="cat-icon" alt="">' : '';
        return '<button class="cat-btn' + (isActive ? ' active' : '') + '" data-cat="' + cat.id + '">' + iconHtml + escapeHtml(cat.name) + '</button>';
      }).join('');
      filterEl.innerHTML = buttons;
      filterEl.querySelectorAll('.cat-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          setCategoryFilter(btn.getAttribute('data-cat'));
        });
      });
    }

    function setCategoryFilter(catId){
      currentCategoryFilter = catId;
      renderCategoryFilter();
      filterProducts();
    }

    function filterProducts(){
      var cards = document.querySelectorAll('.grid .card');
      cards.forEach(function(card){
        var cat = card.getAttribute('data-cat') || '';
        var show = currentCategoryFilter === 'all' || cat === currentCategoryFilter;
        card.style.display = show ? '' : 'none';
      });
    }

    async function loadAndRenderProducts(){
      var grid = document.getElementById('productGrid');
      if (!grid) return; // collection grid removed from this page
      if (!supabase) {
        grid.innerHTML = '<div class="no-results">Store is not connected.</div>';
        return;
      }
      grid.innerHTML = '<div class="grid-loading">Loading collection…</div>';
      try {
        var result = await supabase.from('products').select('*').order('created_at', { ascending: true });
        if (result.error) throw result.error;
        var products = (result.data || []).map(normalizeProduct);
        grid.innerHTML = products.map(productCardHTML).join('');
        if (!products.length) {
          grid.innerHTML = '<div class="no-results">No products yet.</div>';
        }
        filterProducts();
      } catch (e) {
        grid.innerHTML = '<div class="no-results">Could not load products.</div>';
        console.error('loadAndRenderProducts error:', e);
      }
    }

    (function(){
      var imgs = document.querySelectorAll('#ringWrap .ring-photo');
      var dots = document.querySelectorAll('#ringDots span');
      var current = 0;
      var interval = null;
      function show(i){
        imgs.forEach(function(img, idx){ img.classList.toggle('active', idx === i); });
        dots.forEach(function(d, idx){ d.classList.toggle('active', idx === i); });
        current = i;
      }
      function startAuto(){
        stopAuto();
        interval = setInterval(function(){
          show((current + 1) % imgs.length);
        }, 3000);
      }
      function stopAuto(){
        if (interval) { clearInterval(interval); interval = null; }
      }
      dots.forEach(function(d){
        d.addEventListener('click', function(){
          show(parseInt(d.getAttribute('data-i'), 10));
          startAuto();
        });
      });
      var wrap = document.getElementById('ringWrap');
      if (wrap) {
        wrap.addEventListener('mouseenter', stopAuto);
        wrap.addEventListener('mouseleave', startAuto);
      }
      startAuto();
    })();

    function initShopUI(){
      var backdrop = document.getElementById('backdrop');
      var searchPanel = document.getElementById('searchPanel');
      var searchInput = document.getElementById('searchInput');
      var searchStatus = document.getElementById('searchStatus');
      var cartDrawer = document.getElementById('cartDrawer');
      var cards = Array.prototype.slice.call(document.querySelectorAll('.grid .card'));
      var grid = document.querySelector('.grid');

      var state = { search: false, cart: false };

      function anyOpen(){ return state.search || state.cart; }
      function syncBackdrop(){ backdrop.classList.toggle('open', anyOpen()); }

      function closeAll(){
        state.search = false; state.cart = false;
        searchPanel.classList.remove('open');
        cartDrawer.style.display = 'none';
        syncBackdrop();
      }

      // ---- Search ----
      function openSearch(){
        closeAll();
        state.search = true;
        searchPanel.classList.add('open');
        syncBackdrop();
        setTimeout(function(){ searchInput.focus(); }, 200);
      }
      var searchBtn = document.getElementById('searchBtn');
      if (searchBtn) searchBtn.addEventListener('click', openSearch);
      document.getElementById('searchClose').addEventListener('click', closeAll);

      function runSearch(){
        if (!searchInput) return;
        var q = searchInput.value.trim().toLowerCase();
        var visibleCount = 0;
        cards.forEach(function(card){
          var name = (card.getAttribute('data-name') || '').toLowerCase();
          var cat = (card.getAttribute('data-cat') || '').toLowerCase();
          var match = q === '' || name.indexOf(q) !== -1 || cat.indexOf(q) !== -1;
          card.style.display = match ? '' : 'none';
          if (match) visibleCount++;
        });
        var existingNoResults = grid.querySelector('.no-results');
        if (existingNoResults) existingNoResults.remove();
        if (visibleCount === 0 && q !== '') {
          var msg = document.createElement('div');
          msg.className = 'no-results';
          msg.textContent = 'No pieces found for "' + searchInput.value.trim() + '"';
          grid.appendChild(msg);
        }
        if (q === '') {
          searchStatus.textContent = '';
        } else {
          searchStatus.textContent = visibleCount + (visibleCount === 1 ? ' piece found' : ' pieces found');
        }
      }
      if (searchInput) {
        searchInput.addEventListener('input', runSearch);
        searchInput.addEventListener('keydown', function(e){
          if (e.key === 'Enter') {
            document.getElementById('collections').scrollIntoView({ behavior: 'smooth' });
            closeAll();
          }
        });
      }

      // ---- Contact dropdown ----
      var contactBtn = document.getElementById('contactBtn');
      var contactDropdown = document.getElementById('contactDropdown');
      if (contactBtn && contactDropdown) {
        contactBtn.addEventListener('click', function(e){
          e.stopPropagation();
          contactDropdown.style.display = contactDropdown.style.display === 'flex' ? 'none' : 'flex';
        });
        document.addEventListener('click', function(){
          contactDropdown.style.display = 'none';
        });
      }

      // Load contact settings from Supabase
      async function loadContactSettings(){
        try {
          if (!supabase) return;
          var result = await supabase.from('site_settings').select('phone, phone_display, whatsapp').eq('id', 'main').single();
          if (result.data) {
            var phone = result.data.phone || '';
            var phoneDisplay = result.data.phone_display || phone;
            var whatsapp = result.data.whatsapp || phone;
            SITE_PHONE = phoneDisplay || '+91 123456789';
            var phoneEl = document.getElementById('navPhoneNumber');
            var callLink = document.getElementById('dropdownCall');
            var waLink = document.getElementById('dropdownWhatsApp');
            if (phoneEl) phoneEl.textContent = phoneDisplay;
            if (callLink) callLink.href = 'tel:+' + phone;
            if (waLink) waLink.href = 'https://wa.me/' + whatsapp;
            if (phoneDisplay) {
              DEFAULT_DESC = 'A beautiful piece from our collection. Want to know more? Call us at ' + phoneDisplay + '.';
            }
          }
        } catch (e) {
          console.warn('Could not load contact settings:', e);
        }
      }
      loadContactSettings();

      // ---- Cart ----
      var cartCountEl = document.getElementById('cartCount');
      var cartItemsEl = document.getElementById('cartItems');
      var cartTotalEl = document.getElementById('cartTotal');
      var cart = [];

      // Load cart from localStorage
      try {
        var saved = localStorage.getItem('sk_cart');
        if (saved) cart = JSON.parse(saved);
      } catch (e) {}

      function fmt(n){ return '₹' + n.toLocaleString('en-IN'); }

      function saveCart(){
        try { localStorage.setItem('sk_cart', JSON.stringify(cart)); } catch (e) {}
      }

      function renderCart(){
        if (cart.length === 0) {
          cartItemsEl.innerHTML = '<div class="cart-empty">Your bag is empty.</div>';
        } else {
          cartItemsEl.innerHTML = cart.map(function(item, idx){
            var imgSrc = item.image || '';
            var imgHtml = imgSrc ? '<img src="' + imgSrc + '" alt="' + item.name + '">' : '<div class="cart-item-placeholder"></div>';
            return '<div class="cart-item" data-idx="' + idx + '">' +
              '<div class="cart-item-media">' + imgHtml + '</div>' +
              '<div class="cart-item-info"><div class="cart-item-name">' + item.name + '</div><div class="cart-item-cat">' + item.cat + '</div></div>' +
              '<div class="cart-item-right">' +
                '<span class="cart-item-price">' + fmt(item.price) + '</span>' +
                '<div class="cart-item-qty">' +
                  '<button aria-label="Decrease" onclick="cartActions.changeQty(' + idx + ', -1)">−</button>' +
                  '<span>' + item.qty + '</span>' +
                  '<button aria-label="Increase" onclick="cartActions.changeQty(' + idx + ', 1)">+</button>' +
                '</div>' +
                '<button class="cart-item-remove" aria-label="Remove" onclick="cartActions.removeItem(' + idx + ')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>' +
              '</div>' +
            '</div>';
          }).join('');
        }
        var total = cart.reduce(function(sum, item){ return sum + item.price * item.qty; }, 0);
        cartTotalEl.textContent = fmt(total);
        var totalQty = cart.reduce(function(sum, item){ return sum + item.qty; }, 0);
        cartCountEl.textContent = totalQty;
        saveCart();
      }

      // Expose cart actions for inline onclick handlers
      window.cartActions = {
        changeQty: function(idx, delta){
          cart[idx].qty += delta;
          if (cart[idx].qty <= 0) cart.splice(idx, 1);
          if (cart[idx] && cart[idx].qty > 10) cart[idx].qty = 10;
          renderCart();
        },
        removeItem: function(idx){
          cart.splice(idx, 1);
          renderCart();
        },
        addItem: function(item){
          var existing = cart.find(function(c){ return c.id === item.id; });
          if (existing) {
            existing.qty += item.qty || 1;
            if (existing.qty > 10) existing.qty = 10;
          } else {
            cart.push({ id: item.id, name: item.name, cat: item.cat, price: item.price, image: item.image, qty: item.qty || 1 });
          }
          renderCart();
          showToast(item.name, fmtPrice(item.price));
          trackRecentlyViewed({ id: item.id, name: item.name, cat: item.cat, price: item.price, image: item.image });
        }
      };

      function openCart(){
        closeAll();
        state.cart = true;
        cartDrawer.style.display = 'flex';
        syncBackdrop();
      }
      document.getElementById('cartBtn').addEventListener('click', openCart);
      document.getElementById('cartClose').addEventListener('click', closeAll);
      document.getElementById('cartContinueBtn').addEventListener('click', closeAll);
      document.getElementById('cartOverlay').addEventListener('click', closeAll);

      var checkoutBtn = document.getElementById('checkoutBtn');
      var checkoutStatus = document.getElementById('checkoutStatus');
      var checkoutNameEl = document.getElementById('checkoutName');
      var checkoutMobileEl = document.getElementById('checkoutMobile');
      var checkoutAltMobileEl = document.getElementById('checkoutAltMobile');
      var checkoutAddressEl = document.getElementById('checkoutAddress');
      var checkoutMandalEl = document.getElementById('checkoutMandal');
      var checkoutDistrictEl = document.getElementById('checkoutDistrict');

      checkoutBtn.addEventListener('click', async function(){
        if (cart.length === 0) return;

        var name = checkoutNameEl.value.trim();
        var mobile = checkoutMobileEl.value.trim();
        var altMobile = checkoutAltMobileEl.value.trim();
        var address = checkoutAddressEl.value.trim();
        var mandal = checkoutMandalEl.value.trim();
        var district = checkoutDistrictEl.value.trim();

        if (!name || !/^[0-9]{10}$/.test(mobile) || !address || !mandal || !district) {
          checkoutStatus.textContent = 'Please fill in name, a valid 10-digit mobile number, address, mandal and district.';
          checkoutStatus.classList.add('show', 'err');
          return;
        }
        if (!supabase) {
          checkoutStatus.textContent = 'Store isn\'t connected yet — orders can\'t be placed.';
          checkoutStatus.classList.add('show', 'err');
          return;
        }

        var total = cart.reduce(function(sum, item){ return sum + item.price * item.qty; }, 0);
        var orderId = generateOrderId();
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Placing…';
        checkoutStatus.textContent = 'Placing your order…';
        checkoutStatus.classList.add('show');
        checkoutStatus.classList.remove('err');

        try {
          var result = await supabase.from('orders').insert({
            order_id: orderId,
            customer_name: name,
            customer_mobile: mobile,
            customer_alt_mobile: altMobile || null,
            address: address,
            mandal: mandal,
            district: district,
            items: cart,
            total: total,
            status: 'pending'
          });
          if (result.error) throw result.error;

          if (WHATSAPP_NUMBER && WHATSAPP_NUMBER !== 'YOUR_WHATSAPP_NUMBER') {
            var itemLines = cart.map(function(i){ return '- ' + i.name + ' - ₹' + i.price; }).join('\n');
            var msg =
              '*New Order* (' + orderId + ')\n\n' +
              itemLines + '\n' +
              '*Total: ₹' + total + '*\n\n' +
              'Name: ' + name + '\n' +
              'Mobile: ' + mobile + '\n' +
              'Alt. Mobile: ' + (altMobile || '-') + '\n' +
              'Address: ' + address + '\n' +
              'Mandal: ' + mandal + '\n' +
              'District: ' + district;
            window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
          }

          showOrderReceipt({
            orderId: orderId,
            total: total,
            items: cart.map(function(i){ return { name: i.name, price: i.price, qty: i.qty }; }),
            customer: { name: name, mobile: mobile, altMobile: altMobile, address: address, mandal: mandal, district: district },
            date: new Date().toLocaleString(),
            sitePhone: SITE_PHONE
          });

          cart = [];
          renderCart();
          checkoutNameEl.value = '';
          checkoutMobileEl.value = '';
          checkoutAltMobileEl.value = '';
          checkoutAddressEl.value = '';
          checkoutMandalEl.value = '';
          checkoutDistrictEl.value = '';
        } catch (e) {
          checkoutStatus.textContent = 'Could not place order: ' + e.message;
          checkoutStatus.classList.add('err');
        } finally {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = 'Place Order';
        }
      });

      cards.forEach(function(card){
        var btn = card.querySelector('.add-btn');
        btn.addEventListener('click', function(){
          var id = card.getAttribute('data-id');
          var name = card.getAttribute('data-name');
          var cat = card.getAttribute('data-cat');
          var price = parseInt(card.getAttribute('data-price'), 10);
          var img = card.querySelector('.card-media img');
          var image = img ? img.getAttribute('src') : '';

          var existing = cart.find(function(item){ return item.id === id; });
          if (existing) {
            existing.qty += 1;
          } else {
            cart.push({ id: id, name: name, cat: cat, price: price, image: image, qty: 1 });
          }
          renderCart();
          var original = btn.textContent;
          btn.textContent = 'Added ✓';
          setTimeout(function(){ btn.textContent = original; }, 1200);
          showToast(name, fmtPrice(price));
          trackRecentlyViewed({ id: id, name: name, cat: cat, price: price, image: image });
        });

        // Quick view on card image click
        var cardMedia = card.querySelector('.card-media');
        if (cardMedia) {
          cardMedia.style.cursor = 'pointer';
          cardMedia.addEventListener('click', function(){
            var id = card.getAttribute('data-id');
            var name = card.getAttribute('data-name');
            var cat = card.getAttribute('data-cat');
            var price = parseInt(card.getAttribute('data-price'), 10);
            var img = card.querySelector('.card-media img');
            var image = img ? img.getAttribute('src') : '';
            var badge = card.querySelector('.badge');
            var badgeText = badge ? badge.textContent : '';
            var badgeAlt = badge ? badge.classList.contains('alt') : false;
            var oldPriceEl = card.querySelector('.price-old');
            var oldPrice = oldPriceEl ? parseInt(oldPriceEl.textContent.replace(/[^\d]/g, ''), 10) : 0;
            var features = JSON.parse(card.getAttribute('data-features') || '[]');
            openQuickView({ id: id, name: name, cat: cat, price: price, image: image, badge: badgeText, badgeAlt: badgeAlt, oldPrice: oldPrice, description: card.getAttribute('data-desc') || DEFAULT_DESC, features: features.length ? features : DEFAULT_FEATURES });
            trackRecentlyViewed({ id: id, name: name, cat: cat, price: price, image: image });
          });
        }
      });

      renderCart();

      backdrop.addEventListener('click', closeAll);
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape') closeAll();
      });
    }

    // ---- Scroll reveal (Framer-motion style, works both scroll directions) ----
    // Named (not IIFE) because it must re-run after product cards are injected.
    function initReveal(){
      var revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-line');
      revealEls.forEach(function(el, i){
        el.style.transitionDelay = (Math.min(i % 4, 4) * 0.09) + 's';
      });
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          entry.target.classList.toggle('in', entry.isIntersecting);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function(el){ io.observe(el); });
    }
    window.initReveal = initReveal;

    // ---- Stat count-up ----
    (function(){
      var stats = document.querySelectorAll('.stat .num');
      var running = new WeakSet();
      function animate(el){
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1400;
        var start = null;
        running.add(el);
        function step(ts){
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
          else { el.textContent = target; running.delete(el); }
        }
        requestAnimationFrame(step);
      }
      var io2 = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting && !running.has(entry.target)) {
            entry.target.textContent = '0';
            animate(entry.target);
          } else if (!entry.isIntersecting) {
            entry.target.textContent = '0';
          }
        });
      }, { threshold: 0.4 });
      stats.forEach(function(el){ io2.observe(el); });
    })();

    // ---- Hero parallax ----
    (function(){
      var hero = document.querySelector('.hero');
      if (!hero) return;
      var ticking = false;
      window.addEventListener('scroll', function(){
        if (!ticking) {
          window.requestAnimationFrame(function(){
            var y = window.scrollY;
            var offset = Math.min(y * 0.25, 80);
            hero.style.backgroundPosition = 'center calc(30% + ' + offset + 'px)';
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    })();

    // ---- Toast notifications ----
    function showToast(productName, price){
      var container = document.getElementById('toastContainer');
      var toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<div class="toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<div class="toast-body"><div class="toast-title">Added to Bag</div><div class="toast-msg">' + escapeHtml(productName) + ' — ' + price + '</div></div>' +
        '<button class="toast-close" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>';
      container.appendChild(toast);
      toast.querySelector('.toast-close').addEventListener('click', function(){ removeToast(toast); });
      setTimeout(function(){ removeToast(toast); }, 3500);
    }
    function removeToast(toast){
      if (!toast || !toast.parentNode) return;
      toast.classList.add('removing');
      setTimeout(function(){ if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }

    // ---- Quick View Modal ----
    var qvCurrentProduct = null;
    function openQuickView(product){
      qvCurrentProduct = product;
      var modal = document.getElementById('qvModal');
      var imageEl = document.getElementById('qvImage');
      var detailsEl = document.getElementById('qvDetails');
      var badgeHtml = product.badge ? '<span class="qv-badge' + (product.badgeAlt ? ' alt' : '') + '">' + escapeHtml(product.badge) + '</span>' : '';
      var oldPriceHtml = product.oldPrice ? '<span class="qv-price-old">' + fmtPrice(product.oldPrice) + '</span>' : '';
      imageEl.innerHTML = badgeHtml + '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '">';
      detailsEl.innerHTML =
        '<div class="qv-cat">' + escapeHtml(product.cat) + '</div>' +
        '<div class="qv-name">' + escapeHtml(product.name) + '</div>' +
        '<div class="qv-price-row"><span class="qv-price">' + fmtPrice(product.price) + '</span>' + oldPriceHtml + '</div>' +
        '<p class="qv-desc">' + escapeHtml(product.description || DEFAULT_DESC) + '</p>' +
        ((product.features && product.features.length) ? '<ul class="qv-features">' + product.features.map(function(f){ return '<li>' + escapeHtml(f) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="qv-actions">' +
          '<button class="btn btn-gold qv-add-btn">Add to Bag</button>' +
          '<button class="btn btn-outline btn-outline-light qv-close-btn">Close</button>' +
        '</div>';
      detailsEl.querySelector('.qv-add-btn').addEventListener('click', function(){
        closeQuickView();
        var c = document.querySelector('.card[data-id="' + product.id + '"]');
        if (c) c.querySelector('.add-btn').click();
      });
      detailsEl.querySelector('.qv-close-btn').addEventListener('click', closeQuickView);
      modal.classList.add('open');
      document.getElementById('backdrop').classList.add('open');
    }
    function closeQuickView(){
      document.getElementById('qvModal').classList.remove('open');
      document.getElementById('backdrop').classList.remove('open');
    }
    document.getElementById('qvClose').addEventListener('click', closeQuickView);
    document.getElementById('qvOverlay').addEventListener('click', closeQuickView);

    // ---- Size Guide Modal ----
    (function(){
      var modal = document.getElementById('sgModal');
      var closeBtn = document.getElementById('sgClose');
      var overlay = document.getElementById('sgOverlay');
      var links = document.querySelectorAll('.size-guide-link');
      links.forEach(function(link){
        link.addEventListener('click', function(e){ e.preventDefault(); modal.classList.add('open'); });
      });
      if (closeBtn) closeBtn.addEventListener('click', function(){ modal.classList.remove('open'); });
      if (overlay) overlay.addEventListener('click', function(){ modal.classList.remove('open'); });
    })();

    // ---- Recently viewed tracking ----
    var recentlyViewed = [];
    function trackRecentlyViewed(product){
      recentlyViewed = recentlyViewed.filter(function(p){ return p.id !== product.id; });
      recentlyViewed.unshift(product);
      if (recentlyViewed.length > 8) recentlyViewed.pop();
      try { localStorage.setItem('sk_recent', JSON.stringify(recentlyViewed)); } catch(e) {}
    }

    // ---- Back to top button ----
    (function(){
      var btn = document.getElementById('backToTop');
      var ticking = false;
      window.addEventListener('scroll', function(){
        if (!ticking) {
          window.requestAnimationFrame(function(){
            btn.classList.toggle('visible', window.scrollY > 500);
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
      btn.addEventListener('click', function(){
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    })();

    // ---- Footer shop links: click filters to category ----
    document.querySelectorAll('.foot-col a[data-cat]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        var catId = a.getAttribute('data-cat');
        setCategoryFilter(catId);
        document.getElementById('collections').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // ---- Kick off: load categories, then render collection, then wire up shop UI + reveal animations ----
    loadCategories().then(function(){
      return loadAndRenderProducts();
    }).then(function(){
      initShopUI();
      initReveal();
    }).catch(function(err){
      console.error('Failed to initialize shop UI', err);
      initShopUI();
      initReveal();
    });