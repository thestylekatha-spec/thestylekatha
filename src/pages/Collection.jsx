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
import '../styles/aunty.css';

export default function Collection() {
  const [params] = useSearchParams();
  const slug = params.get('slug') || '';
  const catId = params.get('id') || '';
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load category
        const q = supabase.from('categories').select('id, name, slug, description');
        const catRes = slug ? await q.eq('slug', slug).limit(1) : await q.eq('id', catId).limit(1);
        const cat = (catRes.data || [])[0];
        if (cat) {
          setCategory(cat);
          document.title = cat.name + ' — The Style Katha';
          // Load products
          let pr = await supabase.from('products')
            .select('id, name, price, old_price, badge, image_url, is_active, category_id')
            .eq('category_id', cat.id).order('created_at', { ascending: true });
          let list = pr.data || [];
          // Fallback by name
          if (!list.length) {
            const alt = await supabase.from('products')
              .select('id, name, price, old_price, badge, image_url, is_active, category')
              .ilike('category', cat.name).order('created_at', { ascending: true });
            list = alt.data || [];
          }
          setProducts(list);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [slug, catId]);

  const sorted = [...products].sort((a, b) => {
    switch(sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'name-asc': return String(a.name).localeCompare(String(b.name));
      case 'name-desc': return String(b.name).localeCompare(String(a.name));
      default: return 0;
    }
  });

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
            <a className="pd-bag-link" href="/#cart" aria-label="Bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
              <span className="pd-bag-count" data-bag-count>{cartStore.count()}</span>
            </a>
          </div>
        </nav>
      </header>
      <main className="cl-main">
        <nav className="cl-crumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className="cl-dot">•</span>
          <span>{category?.name || 'Collection'}</span>
        </nav>
        <h1 className="cl-title">{(category?.name || 'COLLECTION').toUpperCase()}</h1>
        {category?.description && <p className="cl-desc">{category.description}</p>}
        <div className="cl-toolbar">
          <div className="cl-sort">
            <label htmlFor="sortBy">Sort by:</label>
            <select id="sortBy" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="name-asc">Alphabetically, A–Z</option>
              <option value="name-desc">Alphabetically, Z–A</option>
            </select>
          </div>
        </div>
        <div className="cl-grid">
          {loading ? <div className="cl-loading">Loading products…</div> :
           sorted.length === 0 ? <div className="cl-empty">No products in this collection yet.</div> :
           sorted.map(p => {
            const soldOut = p.is_active === false;
            return (
              <a key={p.id} className="cl-card" href={`/product?id=${p.id}`}>
                <div className="cl-media">
                  {soldOut ? <span className="cl-tag">Out of Stock</span> : p.badge ? <span className="cl-tag sale">{p.badge}</span> : null}
                  <img src={p.image_url} alt={p.name} loading="lazy" onError={e => { e.target.src = '/assets/collections/ring.jpg'; }} />
                </div>
                <h2 className="cl-name">{p.name}</h2>
                <div className="cl-price">{money(p.price)}{p.old_price ? <span className="cl-price-old">{money(p.old_price)}</span> : null}</div>
              </a>
            );
           })}
        </div>
      </main>
      <footer className="cl-footer">
        <p>© {new Date().getFullYear()} The Style Katha — Jewellery · Clothing · Timeless Style</p>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}
