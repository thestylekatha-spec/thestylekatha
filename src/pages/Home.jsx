import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SITE_CONFIG } from '../lib/supabase';
import { cartStore } from '../lib/cartStore';
import { money, generateOrderId } from '../lib/utils';
import '../styles/base.css';
import '../styles/nav.css';
import '../styles/hero.css';
import '../styles/buttons.css';
import '../styles/ring-showcase.css';
import '../styles/usp.css';
import '../styles/footer.css';
import '../styles/animations.css';
import '../styles/search.css';
import '../styles/cart.css';
import '../styles/toast.css';
import '../styles/back-to-top.css';
import '../styles/quick-view.css';
import '../styles/size-guide.css';
import '../styles/collections.css';
import '../styles/aunty.css';

const WHATSAPP_NUMBER = SITE_CONFIG.whatsapp.number;

function CheckoutForm({ cartItems, onSuccess }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [address, setAddress] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cartItems.length) return;
    if (!name || !/^[0-9]{10}$/.test(mobile) || !address || !mandal || !district) {
      setStatus('Please fill in name, a valid 10-digit mobile number, address, mandal and district.');
      return;
    }
    setSubmitting(true);
    setStatus('Placing your order\u2026');
    const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const orderId = generateOrderId();
    try {
      const { error } = await supabase.from('orders').insert({
        order_id: orderId,
        customer_name: name,
        customer_mobile: mobile,
        customer_alt_mobile: altMobile || null,
        address,
        mandal,
        district,
        items: cartItems,
        total,
        status: 'pending',
      });
      if (error) throw error;
      const itemLines = cartItems.map(i => '- ' + i.name + ' - Rs. ' + i.price).join('%0A');
      const msg =
        '*New Order* (' + orderId + ')%0A%0A' +
        itemLines + '%0A' +
        '*Total: Rs. ' + total + '*%0A%0A' +
        'Name: ' + name + '%0A' +
        'Mobile: ' + mobile + '%0A' +
        'Alt. Mobile: ' + (altMobile || '-') + '%0A' +
        'Address: ' + address + '%0A' +
        'Mandal: ' + mandal + '%0A' +
        'District: ' + district;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg, '_blank');
      setName(''); setMobile(''); setAltMobile(''); setAddress(''); setMandal(''); setDistrict('');
      setStatus('');
      onSuccess();
    } catch (err) {
      setStatus('Could not place order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cart-form">
      <div className="field"><label>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
      <div className="field"><label>Mobile Number</label><input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile" maxLength={10} /></div>
      <div className="field"><label>Alt. Mobile (optional)</label><input type="tel" value={altMobile} onChange={e => setAltMobile(e.target.value)} placeholder="Optional" maxLength={10} /></div>
      <div className="field"><label>Address</label><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House no, street, landmark" rows={2} /></div>
      <div className="field-row">
        <div className="field"><label>Mandal</label><input type="text" value={mandal} onChange={e => setMandal(e.target.value)} placeholder="Mandal" /></div>
        <div className="field"><label>District</label><input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="District" /></div>
      </div>
      <button className="btn btn-gold" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Placing\u2026' : 'Place Order'}
      </button>
      <div className="checkout-status">{status}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [ringIdx, setRingIdx] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(cartStore.get());
  const [cartCount, setCartCount] = useState(cartStore.count());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickView, setQuickView] = useState(null);
  const [toast, setToast] = useState(null);
  const [testimonialDot, setTestimonialDot] = useState(0);
  const [instaDot, setInstaDot] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  const testimonialRef = useRef(null);
  const instaRef = useRef(null);
  const contactRef = useRef(null);

  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);

  const [featuredProducts, setFeaturedProducts] = useState({});
  const [dataError, setDataError] = useState(null);

  const RING_IMAGES = ['/assets/ring-1.png', '/assets/ring-2.png', '/assets/ring-3.png'];
  const RING_ALTS = ['1gm gold ring', '1gm gold band ring', '1gm gold statement ring'];

  const TESTIMONIALS = [
    { img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=300&fit=crop', quote: '"Looks super elegant and classy with my Indian saree, loved the pieces very much."', who: 'Ria', price: 'Emerald Luxe AD-Style Necklace Set \u2014 Rs. 1,499.00' },
    { img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=300&fit=crop', quote: '"This Victorian style necklace looked very pretty and added a touch of class to my outfit."', who: 'Sanya', price: 'Pastel Charm Designer Necklace Set \u2014 Rs. 3,299.00' },
    { img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop', quote: '"Bought this as a gift for my girlfriend, she absolutely loved it and it looked amazing on her."', who: 'Krish', price: 'Royal Ruby Kundan Jhumka Earrings \u2014 Rs. 1,599.00' },
    { img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop', quote: '"This anti-tarnish set has very good quality, and the panda charm on it looks super cute."', who: 'Kanika', price: 'Playful Panda Charm Jewellery Set \u2014 Rs. 199.00' },
  ];

  const STAT_CONFIG = [
    { target: 5, suffix: '+', label: 'Years of Craft' },
    { target: 4200, suffix: '+', label: 'Pieces Delivered' },
    { target: 60, suffix: '+', label: 'Cities Served' },
    { target: 98, suffix: '%', label: 'Client Satisfaction' },
  ];

  const showToast = useCallback((name, price) => {
    const id = Date.now();
    setToast({ name, price, id });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const addToCart = useCallback((product) => {
    const updated = cartStore.add({ id: product.id, name: product.name, cat: product.category || '', price: product.price, image: product.image_url });
    setCartItems(updated);
    setCartCount(cartStore.count());
    showToast(product.name, money(product.price));
  }, [showToast]);

  const openQuickView = useCallback((product) => {
    setQuickView({
      id: product.id,
      name: product.name,
      cat: product.category || '',
      price: product.price,
      image: product.image_url,
      badge: product.badge,
      badgeAlt: product.badge_alt,
      oldPrice: product.old_price,
      description: product.description || '',
      features: product.features || [],
      inStock: product.in_stock !== false,
    });
  }, []);

  const filteredProducts = searchQuery.trim()
    ? products.filter(p => {
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      })
    : products;

  useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('products').select('*')
        ]);
        if (catRes.error) {
          console.warn('Categories query error:', catRes.error.message);
          const fallback = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
          if (!fallback.error && fallback.data) setCategories(fallback.data);
        } else if (catRes.data) {
          setCategories(catRes.data);
        }
        if (prodRes.error) {
          console.warn('Products query error:', prodRes.error.message);
          setDataError('Products: ' + prodRes.error.message);
        } else if (prodRes.data && prodRes.data.length) {
          setProducts(prodRes.data);
          setDataError(null);
        } else if (!prodRes.error) {
          console.warn('Products table returned empty');
        }
      } catch (e) {
        console.warn('Could not load data:', e);
        setDataError('Load error: ' + e.message);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!categories.length || !products.length) return;
    const catProds = {};
    for (const cat of categories) {
      let prods = products.filter(p => p.category_id === cat.id && p.image_url);
      if (!prods.length) {
        prods = products.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase() && p.image_url);
      }
      if (prods.length) catProds[cat.id] = prods.slice(0, 20);
    }
    setFeaturedProducts(catProds);
  }, [categories, products]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRingIdx(prev => (prev + 1) % RING_IMAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onScroll() {
      setBackToTopVisible(window.scrollY > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    let running = false;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !running) {
          setStatsVisible(true);
          running = true;
          const targets = STAT_CONFIG.map(s => s.target);
          const duration = 1400;
          const start = performance.now();
          function step(ts) {
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setStatValues(targets.map(t => Math.round(eased * t)));
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        } else if (!entry.isIntersecting && running) {
          running = false;
          setStatsVisible(false);
          setStatValues([0, 0, 0, 0]);
        }
      });
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const grid = testimonialRef.current;
    if (!grid) return;
    function onScroll() {
      const card = grid.querySelector('.t-card');
      if (!card) return;
      const cardW = card.offsetWidth + 20;
      const page = Math.round(grid.scrollLeft / (2 * cardW));
      setTestimonialDot(page);
    }
    grid.addEventListener('scroll', onScroll, { passive: true });
    return () => grid.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const grid = instaRef.current;
    if (!grid) return;
    function onScroll() {
      const child = grid.querySelector('.insta-item, video');
      if (!child) return;
      const cardW = child.offsetWidth + 16;
      const page = Math.round(grid.scrollLeft / (2 * cardW));
      setInstaDot(page);
    }
    grid.addEventListener('scroll', onScroll, { passive: true });
    return () => grid.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (contactRef.current && !contactRef.current.contains(e.target)) setContactOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setCartOpen(false);
        setSearchOpen(false);
        setQuickView(null);
        setSizeGuideOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      document.body.classList.add('page-ready');
    }, 400);
    return () => { clearTimeout(t); document.body.classList.remove('page-ready'); };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-scale, .reveal-stagger');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [categories, products]);

  useEffect(() => {
    if (cartOpen || searchOpen || quickView || sizeGuideOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [cartOpen, searchOpen, quickView, sizeGuideOpen]);

  useEffect(() => {
    if (sessionStorage.getItem('openCart')) {
      sessionStorage.removeItem('openCart');
      setCartOpen(true);
    }
  }, []);

  function handleAddToCartFromQv(product) {
    addToCart(product);
    setQuickView(null);
  }

  return (
    <>
      <a href="#featuredCategories" className="skip-link">Skip to collection</a>

      {dataError && (
        <div style={{ background: '#c0564a', color: '#fff', padding: '10px 20px', fontSize: 13, textAlign: 'center', zIndex: 9999, position: 'relative' }}>
          Data error: {dataError} — Check browser console (F12) for details
        </div>
      )}

      <header>
        <nav>
          <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
            <img src="/assets/logo.png" alt="The Style Katha" className="logo-mark" />
            <div className="logo-text">
              <span className="logo-the">THE</span>
              <span className="logo-brand"><em>STYLE KATHA</em></span>
                  <span className="logo-sub">JEWELLERY · CLOTHING · TIMELESS STYLE</span>
            </div>
          </a>
          <div className="nav-icons">
            <div className="nav-contact" ref={contactRef}>
              <button
                aria-label="Contact us"
                className="nav-contact-btn"
                onClick={e => { e.stopPropagation(); setContactOpen(v => !v); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </button>
              <div className="contact-dropdown" style={{ display: contactOpen ? 'flex' : 'none' }}>
                <a href={'tel:+91' + WHATSAPP_NUMBER} className="contact-dropdown-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  <span>Call Us</span>
                </a>
                <a href={'https://wa.me/' + WHATSAPP_NUMBER} target="_blank" rel="noopener" className="contact-dropdown-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.6" style={{ width: 20, height: 20 }}><path d="M17 5.414l.947-.946a6 6 0 0 1 8.49 0l4.293 4.293a6 6 0 0 1 0 8.49l-5.657 5.657a.75.75 0 0 1-1.06 0L8.5 14.45a12 12 0 0 1-5.195-1.255l-2.882-.55a.75.75 0 0 1-.383-1.187l.433-2.373a12.06 12.06 0 0 1-1.138-4.835 12.06 12.06 0 0 1 4.878-4.833l2.36-.43a.75.75 0 0 1 1.168.37l.473 2.226c1.671.834 2.97 2.05 3.8 3.565a.75.75 0 0 0 1.12-.964 28.57 28.57 0 0 0-5.565-9.474 28.49 28.49 0 0 0-1.173-.385.75.75 0 0 0-.928.514l-.324.553a.75.75 0 0 1-.858.065A12 12 0 0 0 4.5 8.663a.75.75 0 0 1-.297-1.49 13.5 13.5 0 0 1 2.61-5.603l.186-.278a.75.75 0 0 1 1.203.164c3.515 3.106 5.378 7.273 4.93 11.775a.75.75 0 0 1-1.43 1.14 25 25 0 0 1-4.26-9.82.75.75 0 0 1 0-1.06Z" /></svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
            <button aria-label="Cart" className="nav-cart-btn" onClick={() => setCartOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              <span className="nav-cart-label">Bag</span>
              <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </nav>
      </header>

      <section className="hero">
        <span className="eyebrow hero-in">The Style Katha \u2014 1gm Gold Collection</span>
        <h1 className="hero-in">Style, that shines<br /><b>without the weight.</b></h1>
        <p className="sub hero-in">1gm gold look, everyday price \u2014 each piece crafted with care and finished by hand, so you can wear style every day, not just on occasions.</p>
        <div className="hero-ctas hero-in">
          <a href="#featuredCategories" className="btn btn-gold">Explore the Collection</a>
          <a href="#usp" className="btn btn-outline" onClick={e => { e.preventDefault(); document.querySelector('.usp')?.scrollIntoView({ behavior: 'smooth' }); }}>Our Craft</a>
        </div>
        <div className="stage hero-in">
          <div className="pedestal"></div>
          <div className="ring-wrap">
            {RING_IMAGES.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={RING_ALTS[i]}
                className={`ring-photo ${ringIdx === i ? 'active' : ''}`}
              />
            ))}
            <div className="sparkle" style={{ top: 10, left: 20, animationDelay: '.2s' }}></div>
            <div className="sparkle" style={{ top: 60, right: 10, animationDelay: '1.1s' }}></div>
            <div className="sparkle" style={{ bottom: 60, left: 0, animationDelay: '1.8s' }}></div>
          </div>
        </div>
        <div className="dots hero-in">
          {[0, 1, 2].map(i => (
            <span key={i} className={ringIdx === i ? 'active' : ''} onClick={() => setRingIdx(i)} />
          ))}
        </div>
      </section>

      <section className="collections" id="collections">
        <h2>Our Collections</h2>
        <div className="collections-track">
          {categories.map(c => (
            <a key={c.id} className="collection-item" href={`/collection?slug=${c.slug || c.id}`}>
              <img src={c.icon || '/assets/collections/ring.jpg'} alt={c.name} loading="lazy" />
              <div className="label">{c.name}</div>
            </a>
          ))}
        </div>
      </section>

      <div className="ak">
        <div id="featuredCategories"></div>
        {categories.map((cat, idx) => {
          const catProds = featuredProducts[cat.id];
          if (!catProds || !catProds.length) return null;
          const href = `/collection?slug=${cat.slug || cat.id}`;
          const title = (cat.name || '').toUpperCase();
          let cards = '';
          for (const p of catProds) {
            cards += `<a class="product-card" href="/product?id=${encodeURIComponent(p.id)}"><div class="thumb"><img alt="${(p.name || '').replace(/"/g, '&quot;')}" src="${(p.image_url || '').replace(/"/g, '&quot;')}" loading="lazy"/></div><div class="name">${(p.name || '').replace(/</g, '&lt;')}</div><div class="price">${money(p.price)}</div></a>`;
          }
          return (
            <section key={cat.id} className="ak-hero">
              <h1>{title}</h1>
              <a className="shop-now" href={href}>Shop Now</a>
              <section className="product-section">
                <div className="marquee-wrap">
                  <div className={`product-track ${idx % 2 === 1 ? 'reverse' : ''}`} dangerouslySetInnerHTML={{ __html: cards + cards }} />
                </div>
              </section>
            </section>
          );
        })}
        {!categories.length && !products.length && !dataError && (
          <div style={{textAlign:'center',padding:'40px 20px',color:'#7a6f65',fontSize:14}}>Loading products\u2026</div>
        )}
        {!categories.length && products.length > 0 && (
          <section className="ak-hero">
            <h1>ALL PRODUCTS</h1>
            <section className="product-section">
              <div className="marquee-wrap">
                <div className="product-track" dangerouslySetInnerHTML={{
                  __html: products.filter(p => p.image_url).map(p =>
                    `<a class="product-card" href="/product?id=${encodeURIComponent(p.id)}"><div class="thumb"><img alt="${(p.name||'').replace(/"/g,'&quot;')}" src="${(p.image_url||'').replace(/"/g,'&quot;')}" loading="lazy"/></div><div class="name">${(p.name||'').replace(/</g,'&lt;')}</div><div class="price">${money(p.price)}</div></a>`
                  ).join('') + products.filter(p => p.image_url).map(p =>
                    `<a class="product-card" href="/product?id=${encodeURIComponent(p.id)}"><div class="thumb"><img alt="${(p.name||'').replace(/"/g,'&quot;')}" src="${(p.image_url||'').replace(/"/g,'&quot;')}" loading="lazy"/></div><div class="name">${(p.name||'').replace(/</g,'&lt;')}</div><div class="price">${money(p.price)}</div></a>`
                  ).join('')
                }} />
              </div>
            </section>
          </section>
        )}
      </div>

      <section className="usp reveal">
        <span className="eyebrow reveal">Why The Style Katha</span>
        <h2 className="reveal">Built on trust, styled in 1gm gold.</h2>
        <p className="lead reveal">From the first design to the box at your door, every step is handled with the same care we put into every piece.</p>
        <div className="usp-grid">
          <div className="usp-item reveal">
            <div className="usp-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="7" width="13" height="10" rx="1" /><path d="M15 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.6" /><circle cx="18" cy="19" r="1.6" /></svg></div>
            <h3>Pan-India Shipping</h3>
            <p>Safe, tracked delivery to every corner of India \u2014 right to your doorstep.</p>
          </div>
          <div className="usp-item reveal">
            <div className="usp-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg></div>
            <h3>Secure Checkout</h3>
            <p>Bank-level encryption on every order, with easy payment options.</p>
          </div>
          <div className="usp-item reveal">
            <div className="usp-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="9" r="6" /><path d="M8 14.5L6 21l6-3 6 3-2-6.5" /></svg></div>
            <h3>Certified Quality</h3>
            <p>Every piece ships with a quality assurance card and a 1-year warranty against tarnish.</p>
          </div>
        </div>
        <div className="stats" ref={statsRef}>
          {STAT_CONFIG.map((s, i) => (
            <div className="stat reveal-scale" key={i}>
              <div className="num">{statValues[i]}{s.suffix}</div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="ak">
        <section className="testimonials reveal">
          <h2>Customer Say!</h2>
          <div className="sub">Customers love our products and we always strive to please them all.</div>
          <div className="testimonial-grid reveal-stagger" ref={testimonialRef}>
            {TESTIMONIALS.map((t, i) => (
              <div className="t-card" key={i}>
                <img src={t.img} alt={t.who} />
                <div className="quote">{t.quote}</div>
                <div className="who">{t.who} <span>Verified Buyer</span></div>
                <div className="price">{t.price}</div>
              </div>
            ))}
          </div>
          <div className="testimonial-dots">
            {[0, 1].map(i => (
              <span
                key={i}
                className={testimonialDot === i ? 'active' : ''}
                onClick={() => {
                  const grid = testimonialRef.current;
                  if (!grid) return;
                  const card = grid.querySelector('.t-card');
                  if (!card) return;
                  const cardW = card.offsetWidth + 20;
                  grid.scrollTo({ left: i * 2 * cardW, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </section>

        <section className="instagram reveal">
          <h2>FOLLOW US ON INSTAGRAM</h2>
          <div className="handle">
            <a href="https://www.instagram.com/thestylekatha" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>@thestylekatha</a>
          </div>
          <div className="insta-grid" ref={instaRef}>
            {[1, 2, 3, 4, 5].map(n => (
              <div className="insta-item" key={n}>
                <video src={`/assets/${n}.mp4`} autoPlay muted loop playsInline />
              </div>
            ))}
          </div>
          <div className="testimonial-dots" style={{ marginTop: 16 }}>
            {[0, 1].map(i => (
              <span
                key={i}
                className={instaDot === i ? 'active' : ''}
                onClick={() => {
                  const grid = instaRef.current;
                  if (!grid) return;
                  const child = grid.querySelector('.insta-item');
                  if (!child) return;
                  const cardW = child.offsetWidth + 16;
                  grid.scrollTo({ left: i * 2 * cardW, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
          <a className="insta-btn" href="https://www.instagram.com/thestylekatha" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" /></svg>
            Follow us on Instagram
          </a>
        </section>

        <footer>
          <div className="footer-grid">
            <div>
              <div className="logo footer-logo" style={{ marginBottom: 14 }}>
                <img src="/assets/logo.png" alt="The Style Katha" className="logo-mark" />
                <div className="logo-text">
                  <span className="logo-the">THE</span>
                  <span className="logo-brand"><em>STYLE KATHA</em></span>
              <span className="logo-sub">JEWELLERY · CLOTHING · TIMELESS STYLE</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>Delivering elegance, quality, and satisfaction with every order. Explore our curated range of necklaces, earrings, bangles and more.</p>
            </div>
            <div>
              <h4>Collection</h4>
              <ul>
                {categories.length
                  ? categories.map(c => (
                    <li key={c.id}><a href={`/collection?slug=${c.slug || c.id}`}>{c.name}</a></li>
                  ))
                  : <li><span style={{color:'#999',fontSize:13}}>Loading\u2026</span></li>
                }
              </ul>
            </div>
            <div>
              <h4>Follow Us</h4>
              <ul><li><a href="https://www.instagram.com/thestylekatha" target="_blank" rel="noopener">Instagram</a></li></ul>
            </div>
          </div>
          <div className="footer-bottom">
            ALL COPYRIGHTS ARE RESERVED \u00a9 thestylekatha 2026
          </div>
        </footer>
      </div>

      <div className="backdrop" style={{ display: (searchOpen || cartOpen || quickView || sizeGuideOpen) ? 'block' : 'none' }} onClick={() => { setSearchOpen(false); setCartOpen(false); setQuickView(null); setSizeGuideOpen(false); }} />

      <div className="qv-modal" style={{ display: quickView ? 'flex' : 'none' }}>
        <div className="qv-overlay" onClick={() => setQuickView(null)} />
        <div className="qv-content">
          <button className="qv-close" aria-label="Close quick view" onClick={() => setQuickView(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
          </button>
          {quickView && (
            <>
              <div className="qv-image">
                {quickView.badge && <span className={`qv-badge${quickView.badgeAlt ? ' alt' : ''}`}>{quickView.badge}</span>}
                <img src={quickView.image} alt={quickView.name} />
              </div>
              <div className="qv-details">
                <div className="qv-cat">{quickView.cat}</div>
                <div className="qv-name">{quickView.name}</div>
                <div className="qv-price-row">
                  <span className="qv-price">{money(quickView.price)}</span>
                  {quickView.oldPrice && <span className="qv-price-old">{money(quickView.oldPrice)}</span>}
                </div>
                <div className={`qv-stock ${quickView.inStock ? 'in' : 'out'}`}>
                  {quickView.inStock ? 'In stock \u2014 ready to ship' : 'Out of stock'}
                </div>
                {quickView.description && <p className="qv-desc">{quickView.description}</p>}
                {quickView.features && quickView.features.length > 0 && (
                  <ul className="qv-features">
                    {quickView.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
                <div className="qv-actions">
                  <button
                    className="btn btn-gold qv-add-btn"
                    disabled={!quickView.inStock}
                    onClick={() => handleAddToCartFromQv(quickView)}
                  >
                    {quickView.inStock ? 'Add to Bag' : 'Sold Out'}
                  </button>
                  <button className="btn btn-outline btn-outline-light qv-close-btn" onClick={() => setQuickView(null)}>Close</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="sg-modal" style={{ display: sizeGuideOpen ? 'flex' : 'none' }}>
        <div className="sg-overlay" onClick={() => setSizeGuideOpen(false)} />
        <div className="sg-content">
          <div className="sg-header">
            <h2>Ring Size Guide</h2>
            <button className="sg-close" aria-label="Close size guide" onClick={() => setSizeGuideOpen(false)}>&times;</button>
          </div>
          <div className="sg-body">
            <h3>How to Measure</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#5c5142', marginBottom: 20 }}>
              Wrap a thin strip of paper around the base of your finger, mark where it overlaps, then measure the length in mm. Divide by 3.1416 to get the inner circumference.
            </p>
            <h3>Standard Ring Sizes</h3>
            <table className="sg-table">
              <thead><tr><th>India</th><th>US/Canada</th><th>UK/Australia</th><th>Inner Diameter (mm)</th></tr></thead>
              <tbody>
                <tr><td>1</td><td>1.5</td><td>H</td><td>13.5</td></tr>
                <tr><td>2</td><td>2.5</td><td>I\u00bd</td><td>14.5</td></tr>
                <tr><td>3</td><td>3.5</td><td>J\u00bd</td><td>15.0</td></tr>
                <tr><td>4</td><td>4.5</td><td>L</td><td>15.7</td></tr>
                <tr><td>5</td><td>5.5</td><td>M</td><td>16.5</td></tr>
                <tr><td>6</td><td>6.5</td><td>N</td><td>17.3</td></tr>
                <tr><td>7</td><td>7.5</td><td>O</td><td>18.0</td></tr>
                <tr><td>8</td><td>8.5</td><td>P</td><td>18.8</td></tr>
                <tr><td>9</td><td>9.5</td><td>R</td><td>19.8</td></tr>
                <tr><td>10</td><td>10.5</td><td>S</td><td>20.5</td></tr>
              </tbody>
            </table>
            <div className="sg-tip">
              <strong>Tip:</strong> Measure your finger at the end of the day when it is at its largest. If between sizes, go up half a size. All our rings can be resized within 2 sizes at no extra charge.
            </div>
          </div>
        </div>
      </div>

      <div className="toast-container">
        {toast && (
          <div className="toast">
            <div className="toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></div>
            <div className="toast-body">
              <div className="toast-title">Added to Bag</div>
              <div className="toast-msg">{toast.name} \u2014 {toast.price}</div>
            </div>
            <button className="toast-close" aria-label="Dismiss" onClick={() => setToast(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
            </button>
          </div>
        )}
      </div>

      <button className={`back-to-top ${backToTopVisible ? 'visible' : ''}`} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
      </button>

      <div className="search-panel" style={{ display: searchOpen ? 'block' : 'none' }}>
        <div className="search-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" /></svg>
          <input
            type="text"
            placeholder="Search rings, necklaces, earrings, bracelets\u2026"
            autoComplete="off"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus={searchOpen}
          />
          <button className="search-close" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
          </button>
        </div>
        {searchQuery.trim() && (
          <div className="search-status">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'piece found' : 'pieces found'}
          </div>
        )}
      </div>

      {cartOpen && (
        <div className="cart-modal" style={{ display: 'flex' }}>
          <div className="cart-modal-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-modal-body">
            <div className="cart-head">
              <h2>Your Bag</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)}>&times;</button>
            </div>
            <div className="cart-items">
              {cartItems.length === 0
                ? <div className="cart-empty">Your bag is empty.</div>
                : cartItems.map((item, idx) => (
                  <div className="cart-item" key={idx}>
                    <div className="cart-item-media"><img src={item.image} alt={item.name} /></div>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                       <div className="cart-item-cat">{item.cat}{item.customName ? ` · Name: ${item.customName}` : ''}</div>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">{money(item.price)}</span>
                      <div className="cart-item-qty">
                        <button onClick={() => { const updated = cartStore.updateQty(idx, -1); setCartItems(updated); setCartCount(cartStore.count()); }}>&minus;</button>
                        <span>{item.qty}</span>
                        <button onClick={() => { const updated = cartStore.updateQty(idx, 1); setCartItems(updated); setCartCount(cartStore.count()); }}>+</button>
                      </div>
                      <button className="cart-item-remove" onClick={() => { const updated = cartStore.remove(idx); setCartItems(updated); setCartCount(cartStore.count()); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="cart-foot">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span className="amt">{money(cartItems.reduce((s, i) => s + i.price * i.qty, 0))}</span>
              </div>
              <CheckoutForm
                cartItems={cartItems}
                onSuccess={() => { cartStore.clear(); setCartItems([]); setCartCount(0); setCartOpen(false); }}
              />
              <button className="btn btn-outline cart-continue-btn" onClick={() => setCartOpen(false)}>Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
