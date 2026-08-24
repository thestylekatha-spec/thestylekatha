import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { money } from '../lib/utils';
import { cartStore } from '../lib/cartStore';
import '../styles/base.css';
import '../styles/nav.css';
import '../styles/footer.css';
import '../styles/toast.css';
import '../styles/collections.css';
import '../styles/product.css';

const DEFAULT_FEATURES = [
  '1gm gold-look finish',
  'Anti-tarnish coated',
  'Skin friendly, nickel free',
  'Comes in a gift-ready box'
];

export default function Product() {
  const [params] = useSearchParams();
  const productId = params.get('id') || '';
  const [product, setProduct] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(cartStore.count());

  useEffect(() => {
    async function load() {
      if (!productId) { setLoading(false); return; }
      try {
        const res = await supabase.from('products')
          .select('id, name, price, old_price, badge, image_url, is_active, description, features, category, category_id')
          .eq('id', productId).limit(1);
        const p = (res.data || [])[0];
        if (!p) { setLoading(false); return; }
        setProduct(p);
        document.title = p.name + ' — The Style Katha';

        // Get category name
        if (p.category_id) {
          const cr = await supabase.from('categories').select('name, slug').eq('id', p.category_id).limit(1);
          const cat = (cr.data || [])[0];
          if (cat) { setCatName(cat.name); setCatSlug(cat.slug || ''); }
        } else {
          setCatName(p.category || '');
        }

        // Related products
        if (p.category_id) {
          const rel = await supabase.from('products').select('id, name, price, old_price, badge, image_url, is_active, category_id')
            .eq('category_id', p.category_id).neq('id', p.id).limit(8);
          setRelated(rel.data || []);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [productId]);

  function handleAddToBag() {
    if (!product) return;
    const isCustom = /custom/.test(String(catSlug)) || /custom/i.test(String(product.category || ''));
    if (isCustom && !customName.trim()) return;
    cartStore.add({
      id: product.id, name: product.name, cat: catName || product.category || '',
      price: Number(product.price) || 0, image: product.image_url, customName: isCustom ? customName.trim() : ''
    }, qty);
    setCartCount(cartStore.count());
    setToast(product.name);
    setTimeout(() => setToast(null), 3200);
  }

  if (loading) return <div className="cl-page pd-page"><main className="cl-main pd-main"><div className="cl-loading">Loading product…</div></main></div>;
  if (!product) return <div className="cl-page pd-page"><main className="cl-main pd-main"><div className="cl-empty">This product could not be found.</div></main></div>;

  const soldOut = product.is_active === false || product.in_stock === false;
  const features = Array.isArray(product.features) && product.features.length ? product.features : DEFAULT_FEATURES;
  const isCustom = /custom/.test(String(catSlug)) || /custom/i.test(String(product.category || ''));

  return (
    <div className="cl-page pd-page">
      <header>
        <nav>
          <a className="logo" href="/">
            <img src="/assets/logo.png" alt="The Style Katha" className="logo-mark" />
            <div className="logo-text">
              <span className="logo-the">THE</span>
              <span className="logo-brand"><em>STYLE KATHA</em></span>
              <span className="logo-sub">JEWELLERY · CLOTHING · TIMELESS STYLE</span>
            </div>
          </a>
          <div className="nav-icons">
            <a className="cl-nav-link" href="/">Home</a>
            <a className="pd-bag-link" href="/" onClick={e => { e.preventDefault(); window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'}); }} aria-label="Bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
              <span className="pd-bag-count" data-bag-count>{cartCount}</span>
            </a>
          </div>
        </nav>
      </header>
      <main className="cl-main pd-main">
        <nav className="cl-crumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="cl-dot">•</span>
          <a href={catSlug ? `/collection?slug=${catSlug}` : '/'}>{catName || 'Collection'}</a>
          <span className="cl-dot">•</span>
          <span>{product.name}</span>
        </nav>
        <div className="pd-wrap">
          <div className="pd-media">
            {soldOut ? <span className="pd-badge">Out of Stock</span> : product.badge ? <span className="pd-badge">{product.badge}</span> : null}
            <img src={product.image_url} alt={product.name} onError={e => { e.target.src = '/assets/collections/ring.jpg'; }} />
          </div>
          <div className="pd-info">
            <div className="pd-cat">{catName || product.category || 'Jewellery'}</div>
            <h1 className="pd-name">{product.name}</h1>
            <div className="pd-price-row">
              <span className="pd-price">{money(product.price)}</span>
              {product.old_price && <span className="pd-price-old">{money(product.old_price)}</span>}
              {product.old_price && <span className="pd-save">Save {money(Number(product.old_price) - Number(product.price))}</span>}
            </div>
            <div className="pd-tax">Inclusive of all taxes</div>
            {isCustom && (
              <div className="pd-qty-row">
                <span className="pd-qty-label">Name on piece</span>
                <input type="text" className="pd-custom-input" maxLength={15} placeholder="e.g. Ananya" value={customName} onChange={e => setCustomName(e.target.value)} autoComplete="off" />
              </div>
            )}
            <div className={`pd-stock ${soldOut ? 'out' : 'in'}`}>{soldOut ? 'Out of stock' : 'In stock — ready to ship'}</div>
            <p className="pd-desc">{product.description || 'Handpicked 1gm gold-look jewellery, finished with an anti-tarnish coat so it keeps its shine wear after wear.'}</p>
            <ul className="pd-features">{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            <div className="pd-qty-row">
              <span className="pd-qty-label">Quantity</span>
              <div className="pd-qty">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(99, q + 1))}>+</button>
              </div>
            </div>
            <div className="pd-actions">
              <button className="pd-btn pd-btn-gold" disabled={soldOut} onClick={handleAddToBag}>{soldOut ? 'Sold Out' : 'Add to Bag'}</button>
              <a className="pd-btn pd-btn-outline" href="/" onClick={e => { e.preventDefault(); window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'}); }}>View Bag</a>
            </div>
            <div className="pd-meta">Free shipping on prepaid orders · Easy 3-day returns · Cash on delivery available</div>
          </div>
        </div>
        {related.length > 0 && (
          <section className="pd-related">
            <h2 className="pd-related-title">You may also like</h2>
            <div className="cl-grid">
              {related.map(p => (
                <a key={p.id} className="cl-card" href={`/product?id=${p.id}`}>
                  <div className="cl-media">
                    {p.is_active === false ? <span className="cl-tag">Out of Stock</span> : null}
                    <img src={p.image_url} alt={p.name} loading="lazy" onError={e => { e.target.src = '/assets/collections/ring.jpg'; }} />
                  </div>
                  <h2 className="cl-name">{p.name}</h2>
                  <div className="cl-price">{money(p.price)}{p.old_price ? <span className="cl-price-old">{money(p.old_price)}</span> : null}</div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="cl-footer">
        <p>© {new Date().getFullYear()} The Style Katha — Jewellery · Clothing · Timeless Style</p>
        <a href="/">Back to home</a>
      </footer>
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <div className="toast-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div className="toast-body"><div className="toast-title">Added to Bag</div><div className="toast-msg">{toast}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
