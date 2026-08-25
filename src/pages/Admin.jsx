import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SITE_CONFIG } from '../lib/supabase';
import { dbErrorMessage } from '../lib/supabase';

const PRODUCT_BUCKET = SITE_CONFIG.storage.productBucket;

const V = {
  bgDark: '#13110d',
  bgDark2: '#1c1912',
  cream: '#f5efe2',
  cream2: '#ece3cf',
  ink: '#28221a',
  gold: '#c9a35c',
  goldDeep: '#9c7b3c',
  goldSoft: '#e6cd97',
  line: 'rgba(201,163,92,0.35)',
  danger: '#c0564a',
  ok: '#7fb896',
};

const STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
const BADGES = ['', 'New', 'Bestseller', 'Limited'];

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'piece';
}

function fmtMoney(n) {
  return '\u20B9' + Number(n).toLocaleString('en-IN');
}

function fmtDate(s) {
  try { return new Date(s).toLocaleString(); } catch (e) { return s; }
}

const s = {
  body: {
    background: V.bgDark,
    color: V.cream,
    fontFamily: "'Jost', sans-serif",
    minHeight: '100vh',
  },
  header: {
    borderBottom: `1px solid ${V.line}`,
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
  },
  brand: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '22px',
    letterSpacing: '0.14em',
  },
  brandEm: { color: V.gold, fontStyle: 'normal' },
  sub: {
    fontSize: '11px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: V.goldSoft,
    opacity: 0.8,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
  },
  headerLink: {
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: V.goldSoft,
    textDecoration: 'none',
  },
  main: { maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px' },
  cardPanel: {
    background: V.bgDark2,
    border: `1px solid ${V.line}`,
    borderRadius: 10,
    padding: 24,
    marginBottom: 28,
  },
  cardPanelH2: {
    fontSize: 22,
    marginBottom: 6,
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    letterSpacing: '0.01em',
  },
  panelHint: {
    fontSize: 13,
    color: 'rgba(245,239,226,0.6)',
    marginBottom: 18,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: V.goldSoft,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    background: V.bgDark,
    border: `1px solid ${V.line}`,
    color: V.cream,
    padding: '11px 12px',
    borderRadius: 6,
    fontFamily: "'Jost', sans-serif",
    fontSize: 14,
    marginBottom: 16,
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputFile: {
    width: '100%',
    color: 'rgba(245,239,226,0.75)',
    fontSize: 13,
    marginBottom: 16,
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  btn: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '12px 22px',
    borderRadius: 6,
    border: `1px solid ${V.gold}`,
    background: V.gold,
    color: V.bgDark,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnGhost: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '12px 22px',
    borderRadius: 6,
    border: `1px solid ${V.line}`,
    background: 'transparent',
    color: V.cream,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnSmall: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '7px 12px',
    borderRadius: 6,
    border: `1px solid ${V.line}`,
    background: 'transparent',
    color: V.cream,
    cursor: 'pointer',
  },
  btnDanger: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '7px 12px',
    borderRadius: 6,
    border: `1px solid ${V.danger}`,
    background: 'transparent',
    color: V.danger,
    cursor: 'pointer',
  },
  status: {
    marginTop: 14,
    fontSize: 13,
    padding: '10px 12px',
    borderRadius: 6,
    lineHeight: 1.5,
  },
  productRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: V.bgDark,
    border: `1px solid ${V.line}`,
    borderRadius: 8,
    padding: '10px 12px',
  },
  productRowImg: {
    width: 52,
    height: 52,
    objectFit: 'cover',
    borderRadius: 6,
    background: '#000',
  },
  productRowInfo: { flex: 1, minWidth: 0 },
  productRowName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 16,
  },
  productRowMeta: {
    fontSize: 12,
    color: 'rgba(245,239,226,0.55)',
  },
  orderRow: {
    background: V.bgDark,
    border: `1px solid ${V.line}`,
    borderRadius: 8,
    padding: '14px 16px',
  },
  orderHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  orderCust: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 17,
  },
  orderId: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 12,
    color: V.goldSoft,
    display: 'block',
    letterSpacing: '0.04em',
  },
  orderTotal: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 18,
    color: V.goldSoft,
  },
  orderMeta: {
    fontSize: 11,
    color: 'rgba(245,239,226,0.45)',
    marginTop: 2,
  },
  orderDetails: {
    marginTop: 10,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${V.line}`,
    borderRadius: 6,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 16px',
    fontSize: 13,
  },
  orderDetailFull: { gridColumn: '1 / -1' },
  orderDetailLabel: {
    fontSize: 10,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'rgba(245,239,226,0.45)',
    display: 'block',
  },
  orderDetailValue: { color: 'rgba(245,239,226,0.9)', wordBreak: 'break-word' },
  orderItems: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(245,239,226,0.8)',
  },
  orderItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderBottom: `1px dashed ${V.line}`,
  },
  statusPill: {
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 9px',
    borderRadius: 20,
    border: `1px solid ${V.line}`,
  },
  emptyState: {
    fontSize: 13,
    color: 'rgba(245,239,226,0.5)',
    padding: '14px 0',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    background: V.bgDark2,
    border: `1px solid ${V.line}`,
    borderRadius: 12,
    padding: 28,
    width: 'min(460px, 92vw)',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalH3: {
    margin: '0 0 4px',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 600,
    color: V.cream,
  },
  dropZone: {
    border: `2px dashed rgba(201,163,92,0.4)`,
    borderRadius: 8,
    padding: 30,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color .2s',
    marginBottom: 16,
  },
  bulkItemRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: `1px solid rgba(245,239,226,0.1)`,
  },
};

const statusStyles = {
  ok: {
    background: 'rgba(90,140,110,0.15)',
    color: '#a9d6b8',
    border: '1px solid rgba(90,140,110,0.4)',
  },
  err: {
    background: 'rgba(192,86,74,0.12)',
    color: '#e6a89f',
    border: '1px solid rgba(192,86,74,0.4)',
  },
  info: {
    background: 'rgba(201,163,92,0.1)',
    color: V.goldSoft,
    border: `1px solid ${V.line}`,
  },
};

const pillColors = {
  pending: { color: V.goldSoft, borderColor: V.gold },
  paid: { color: V.ok, borderColor: V.ok },
  shipped: { color: '#9ec7e6', borderColor: '#9ec7e6' },
  completed: { color: V.ok, borderColor: V.ok },
  cancelled: { color: V.danger, borderColor: V.danger },
};

function StatusBanner({ kind, msg }) {
  if (!msg) return null;
  return (
    <div style={{ ...s.status, ...statusStyles[kind] }}>{msg}</div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addStatus, setAddStatus] = useState(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addOldPrice, setAddOldPrice] = useState('');
  const [addBadge, setAddBadge] = useState('');
  const [addInStock, setAddInStock] = useState('true');
  const [addDesc, setAddDesc] = useState('');
  const [addFeatures, setAddFeatures] = useState('');
  const [addImage, setAddImage] = useState(null);
  const addFormRef = useRef(null);

  const [catStatus, setCatStatus] = useState(null);
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catActive, setCatActive] = useState('true');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState(null);
  const [catIconPreview, setCatIconPreview] = useState(null);
  const catFormRef = useRef(null);

  const [catListStatus, setCatListStatus] = useState(null);

  const [settingsStatus, setSettingsStatus] = useState(null);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsPhoneDisplay, setSettingsPhoneDisplay] = useState('');
  const [settingsWhatsApp, setSettingsWhatsApp] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');

  const [listStatus, setListStatus] = useState(null);
  const [orderStatusMsg, setOrderStatusMsg] = useState(null);

  const [editProduct, setEditProduct] = useState(null);
  const [editCat, setEditCat] = useState(null);

  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkDefaultCat, setBulkDefaultCat] = useState('');
  const [bulkStatus, setBulkStatus] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkDropRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  const ordersChannelRef = useRef(null);

  const clearStatus = useCallback((fn) => fn(null), []);

  const statusHelper = useCallback((fn, kind, msg) => {
    fn({ kind, msg });
  }, []);

  // ---- Auth ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- Load data when session changes ----
  useEffect(() => {
    if (!session) return;
    loadProducts();
    loadCategories();
    loadOrders();
    loadSettings();
    subscribeToOrders();
    return () => unsubscribeFromOrders();
  }, [session]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      setListStatus({ kind: 'err', msg: dbErrorMessage('Products', e) });
    }
    setProductsLoading(false);
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      setCatListStatus({ kind: 'err', msg: e.message });
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      setOrderStatusMsg({ kind: 'err', msg: e.message });
    }
    setOrdersLoading(false);
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettingsPhone(data.phone || '');
        setSettingsPhoneDisplay(data.phone_display || '');
        setSettingsWhatsApp(data.whatsapp || '');
        setSettingsEmail(data.email || '');
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  };

  const subscribeToOrders = () => {
    if (ordersChannelRef.current) return;
    ordersChannelRef.current = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();
  };

  const unsubscribeFromOrders = () => {
    if (ordersChannelRef.current) {
      supabase.removeChannel(ordersChannelRef.current);
      ordersChannelRef.current = null;
    }
  };

  // ---- Login ----
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginStatus({ kind: 'err', msg: 'Enter your email and password.' });
      return;
    }
    setLoginLoading(true);
    setLoginStatus(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
      if (error) throw error;
      setLoginPassword('');
    } catch (e) {
      setLoginStatus({ kind: 'err', msg: e.message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ---- Add Product ----
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const name = addName.trim();
    const categoryId = addCategory;
    const price = parseInt(addPrice, 10);
    const oldPriceVal = addOldPrice;
    const oldPrice = oldPriceVal ? parseInt(oldPriceVal, 10) : null;
    const badge = addBadge;
    const inStock = addInStock === 'true';
    const description = addDesc.trim();
    const featuresRaw = addFeatures.trim();
    const features = featuresRaw ? featuresRaw.split('\n').map(l => l.trim()).filter(Boolean) : [];
    const file = addImage;

    if (!name || !categoryId || isNaN(price) || !file) {
      setAddStatus({ kind: 'err', msg: 'Fill in name, category, price and choose an image.' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAddStatus({ kind: 'err', msg: 'Image is over 8MB \u2014 please use a smaller file.' });
      return;
    }

    setAddSubmitting(true);
    setAddStatus({ kind: 'info', msg: 'Uploading image\u2026' });

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const slug = slugify(name) + '-' + Date.now();
      const imagePath = slug + '.' + ext;

      const { error: uploadErr } = await supabase.storage
        .from(PRODUCT_BUCKET)
        .upload(imagePath, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(imagePath);
      const imageUrl = urlData.publicUrl;

      setAddStatus({ kind: 'info', msg: 'Saving product\u2026' });

      const newProduct = {
        name,
        category: categoryId,
        category_id: categoryId,
        price,
        old_price: oldPrice,
        badge: badge || null,
        badge_alt: badge === 'Bestseller',
        image_url: imageUrl,
        image_path: imagePath,
        description: description || null,
        features: features.length ? features : null,
        in_stock: inStock,
      };

      const { error: insertErr } = await supabase.from('products').insert(newProduct);
      if (insertErr) throw insertErr;

      setAddStatus({ kind: 'ok', msg: `"${name}" published \u2014 live on the site now.` });
      setAddName('');
      setAddCategory('');
      setAddPrice('');
      setAddOldPrice('');
      setAddBadge('');
      setAddInStock('true');
      setAddDesc('');
      setAddFeatures('');
      setAddImage(null);
      if (addFormRef.current) addFormRef.current.reset();
      loadProducts();
    } catch (e) {
      setAddStatus({ kind: 'err', msg: e.message });
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---- Delete Product ----
  const deleteProduct = async (id) => {
    if (!window.confirm('Remove this piece from the live collection?')) return;
    setListStatus(null);
    try {
      const { data, error } = await supabase.from('products').delete().eq('id', id).select();
      if (error) throw error;
      const removed = data && data[0];
      if (removed && removed.image_path) {
        await supabase.storage.from(PRODUCT_BUCKET).remove([removed.image_path]).catch(() => {});
      }
      setListStatus({ kind: 'ok', msg: 'Removed.' });
      loadProducts();
    } catch (e) {
      setListStatus({ kind: 'err', msg: e.message });
    }
  };

  // ---- Category Form ----
  const handleCatIconChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCatIconPreview(ev.target.result);
      reader.readAsDataURL(file);
      setCatIcon(file);
    } else {
      setCatIconPreview(null);
      setCatIcon(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = catName.trim();
    const slug = catSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const sortOrder = parseInt(catOrder, 10) || 0;
    const isActive = catActive === 'true';
    const description = catDesc.trim();

    if (!name || !slug) {
      setCatStatus({ kind: 'err', msg: 'Name and slug are required.' });
      return;
    }

    setCatSubmitting(true);
    setCatStatus({ kind: 'info', msg: 'Saving\u2026' });

    try {
      const newCat = {
        id: slug,
        name,
        slug,
        description: description || null,
        sort_order: sortOrder,
        is_active: isActive,
        icon: null,
      };

      if (catIcon) {
        setCatStatus({ kind: 'info', msg: 'Uploading icon\u2026' });
        const iconExt = catIcon.name.split('.').pop().toLowerCase();
        const iconPath = 'cat-icons/' + slug + '.' + iconExt;
        const { error: iconErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(iconPath, catIcon, { cacheControl: '3600', upsert: true });
        if (iconErr) throw iconErr;
        const { data: iconData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(iconPath);
        newCat.icon = iconData.publicUrl;
      }

      const { error } = await supabase.from('categories').insert(newCat);
      if (error) throw error;
      setCatStatus({ kind: 'ok', msg: `"${name}" added.` });
      setCatName('');
      setCatSlug('');
      setCatOrder('0');
      setCatActive('true');
      setCatDesc('');
      setCatIcon(null);
      setCatIconPreview(null);
      if (catFormRef.current) catFormRef.current.reset();
      loadCategories();
    } catch (e) {
      setCatStatus({ kind: 'err', msg: e.message });
    } finally {
      setCatSubmitting(false);
    }
  };

  // ---- Delete Category ----
  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Products using it will keep the category name but lose the link.')) return;
    setCatListStatus(null);
    try {
      const { data: catData } = await supabase.from('categories').select('icon').eq('id', id).single();
      if (catData?.icon) {
        const iconPath = catData.icon.split('/cat-icons/')[1];
        if (iconPath) await supabase.storage.from(PRODUCT_BUCKET).remove(['cat-icons/' + iconPath]).catch(() => {});
      }
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCatListStatus({ kind: 'ok', msg: 'Category deleted.' });
      loadCategories();
    } catch (e) {
      setCatListStatus({ kind: 'err', msg: e.message });
    }
  };

  // ---- Site Settings ----
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const phone = settingsPhone.trim();
    const phoneDisplay = settingsPhoneDisplay.trim();
    const whatsapp = settingsWhatsApp.trim();
    const email = settingsEmail.trim();

    if (!phone) {
      setSettingsStatus({ kind: 'err', msg: 'Phone number is required.' });
      return;
    }

    setSettingsSubmitting(true);
    setSettingsStatus({ kind: 'info', msg: 'Saving\u2026' });

    try {
      const settings = {
        id: 'main',
        phone,
        phone_display: phoneDisplay,
        whatsapp: whatsapp || phone,
        email: email || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('site_settings').upsert(settings);
      if (error) throw error;
      setSettingsStatus({ kind: 'ok', msg: 'Settings saved.' });
      loadSettings();
    } catch (e) {
      setSettingsStatus({ kind: 'err', msg: e.message });
    } finally {
      setSettingsSubmitting(false);
    }
  };

  // ---- Edit Product Modal ----
  const [editDesc, setEditDesc] = useState('');
  const [editFeatures, setEditFeatures] = useState('');
  const [editInStock, setEditInStock] = useState('true');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editStatus, setEditStatus] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const openEditProduct = (p) => {
    setEditProduct(p);
    setEditDesc(p.description || '');
    try {
      const feats = Array.isArray(p.features) ? p.features : [];
      setEditFeatures(feats.join('\n'));
    } catch {
      setEditFeatures('');
    }
    setEditInStock(p.in_stock === false ? 'false' : 'true');
    setEditImageFile(null);
    setEditStatus(null);
  };

  const closeEditProduct = () => {
    setEditProduct(null);
    setEditDesc('');
    setEditFeatures('');
    setEditInStock('true');
    setEditImageFile(null);
    setEditStatus(null);
    setEditSaving(false);
  };

  const saveEditProduct = async () => {
    if (!editProduct) return;
    const desc = editDesc.trim();
    const featuresRaw = editFeatures.trim();
    const features = featuresRaw ? featuresRaw.split('\n').map(l => l.trim()).filter(Boolean) : null;
    const inStock = editInStock === 'true';
    const file = editImageFile;

    setEditSaving(true);
    setEditStatus({ kind: 'info', msg: 'Saving\u2026' });

    try {
      const updateData = { description: desc || null, features, in_stock: inStock };
      if (file) {
        if (file.size > 8 * 1024 * 1024) throw new Error('Image is over 8MB.');
        setEditStatus({ kind: 'info', msg: 'Uploading image\u2026' });
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const slug = editProduct.id + '-' + Date.now();
        const imagePath = slug + '.' + ext;
        const { error: uploadErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(imagePath, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(imagePath);
        updateData.image_url = urlData.publicUrl;
        updateData.image_path = imagePath;
        if (editProduct.image_path) {
          await supabase.storage.from(PRODUCT_BUCKET).remove([editProduct.image_path]).catch(() => {});
        }
        setEditStatus({ kind: 'info', msg: 'Saving product\u2026' });
      }
      const { error } = await supabase.from('products').update(updateData).eq('id', editProduct.id);
      if (error) throw error;
      setEditStatus({ kind: 'ok', msg: 'Saved!' });
      setTimeout(() => {
        closeEditProduct();
        loadProducts();
      }, 800);
    } catch (e) {
      setEditStatus({ kind: 'err', msg: e.message });
    } finally {
      setEditSaving(false);
    }
  };

  // ---- Edit Category Modal ----
  const [editCatData, setEditCatData] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatOrder, setEditCatOrder] = useState('0');
  const [editCatActive, setEditCatActive] = useState('true');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatIconFile, setEditCatIconFile] = useState(null);
  const [editCatStatus, setEditCatStatus] = useState(null);
  const [editCatSaving, setEditCatSaving] = useState(false);

  const openEditCategory = (c) => {
    setEditCatData(c);
    setEditCatName(c.name || '');
    setEditCatSlug(c.slug || '');
    setEditCatOrder(String(c.sort_order || 0));
    setEditCatActive(c.is_active ? 'true' : 'false');
    setEditCatDesc(c.description || '');
    setEditCatIconFile(null);
    setEditCatStatus(null);
  };

  const closeEditCategory = () => {
    setEditCatData(null);
    setEditCatName('');
    setEditCatSlug('');
    setEditCatOrder('0');
    setEditCatActive('true');
    setEditCatDesc('');
    setEditCatIconFile(null);
    setEditCatStatus(null);
    setEditCatSaving(false);
  };

  const saveEditCategory = async () => {
    if (!editCatData) return;
    const name = editCatName.trim();
    const slug = editCatSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const sortOrder = parseInt(editCatOrder, 10) || 0;
    const isActive = editCatActive === 'true';
    const description = editCatDesc.trim();
    const file = editCatIconFile;

    if (!name || !slug) {
      setEditCatStatus({ kind: 'err', msg: 'Name and slug are required.' });
      return;
    }

    setEditCatSaving(true);
    setEditCatStatus({ kind: 'info', msg: 'Saving\u2026' });

    try {
      const updateData = {
        name,
        slug,
        sort_order: sortOrder,
        is_active: isActive,
        description: description || null,
      };

      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Icon is over 5MB.');
        setEditCatStatus({ kind: 'info', msg: 'Uploading icon\u2026' });
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const iconPath = 'cat-icons/' + slug + '.' + ext;
        const { error: iconErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(iconPath, file, { cacheControl: '3600', upsert: true });
        if (iconErr) throw iconErr;
        const { data: iconData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(iconPath);
        updateData.icon = iconData.publicUrl;
        if (editCatData.icon && editCatData.icon !== iconData.publicUrl) {
          const oldPath = editCatData.icon.split('/cat-icons/')[1];
          if (oldPath) await supabase.storage.from(PRODUCT_BUCKET).remove(['cat-icons/' + oldPath]).catch(() => {});
        }
        setEditCatStatus({ kind: 'info', msg: 'Saving category\u2026' });
      }

      const { error } = await supabase.from('categories').update(updateData).eq('id', editCatData.id);
      if (error) throw error;
      setEditCatStatus({ kind: 'ok', msg: 'Saved!' });
      setTimeout(() => {
        closeEditCategory();
        loadCategories();
      }, 800);
    } catch (e) {
      setEditCatStatus({ kind: 'err', msg: e.message });
    } finally {
      setEditCatSaving(false);
    }
  };

  // ---- Update Order Status ----
  const updateOrderStatus = async (id, status) => {
    setOrderStatusMsg(null);
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      setOrderStatusMsg({ kind: 'ok', msg: 'Order updated.' });
      loadOrders();
    } catch (e) {
      setOrderStatusMsg({ kind: 'err', msg: e.message });
    }
  };

  // ---- Bulk Upload ----
  const handleBulkDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bulkDropRef.current) bulkDropRef.current.style.borderColor = 'rgba(201,163,92,0.4)';
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) addBulkFiles(files);
  };

  const handleBulkDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bulkDropRef.current) bulkDropRef.current.style.borderColor = V.gold;
  };

  const handleBulkDragLeave = () => {
    if (bulkDropRef.current) bulkDropRef.current.style.borderColor = 'rgba(201,163,92,0.4)';
  };

  const addBulkFiles = (files) => {
    setBulkFiles(files);
    setBulkItems(files.map((f, i) => ({
      idx: i,
      name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      price: '',
      oldPrice: '',
      category: '',
      inStock: 'true',
      preview: URL.createObjectURL(f),
    })));
  };

  const updateBulkItem = (idx, field, value) => {
    setBulkItems(prev => prev.map(item => item.idx === idx ? { ...item, [field]: value } : item));
  };

  const handleBulkUpload = async () => {
    if (!bulkFiles.length) return;
    setBulkUploading(true);
    setBulkStatus({ kind: 'info', msg: `Uploading 0/${bulkFiles.length}...` });
    const defaultCat = bulkDefaultCat;
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const f = bulkFiles[i];
      const item = bulkItems.find(it => it.idx === i);
      const name = item ? item.name.trim() : f.name.replace(/\.[^.]+$/, '');
      const price = item ? parseInt(item.price, 10) : 0;
      const oldPrice = item && item.oldPrice ? parseInt(item.oldPrice, 10) : null;
      const cat = (item && item.category) || defaultCat;
      const inStock = item ? item.inStock === 'true' : true;

      if (!name || isNaN(price) || !price) {
        errors++;
        setBulkStatus({ kind: 'info', msg: `Skipping "${name}" \u2014 no name or price. (${i + 1}/${bulkFiles.length})` });
        continue;
      }

      try {
        const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
        const fileSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
        const imagePath = 'products/' + fileSlug + '.' + ext;

        const { error: upErr } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .upload(imagePath, f, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(imagePath);

        const product = {
          name,
          category: cat || null,
          category_id: cat || null,
          price,
          old_price: oldPrice || null,
          badge: null,
          badge_alt: false,
          image_url: urlData.publicUrl,
          image_path: imagePath,
          description: null,
          features: null,
          in_stock: inStock,
        };

        const { error: insErr } = await supabase.from('products').insert(product);
        if (insErr) throw insErr;
        uploaded++;
        setBulkStatus({ kind: 'info', msg: `Uploaded ${uploaded}/${bulkFiles.length}...` });
      } catch (e) {
        errors++;
        console.error('Bulk upload error for ' + name + ':', e);
      }
    }

    setBulkUploading(false);
    setBulkFiles([]);
    setBulkItems([]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    setBulkStatus({ kind: 'ok', msg: `Done! ${uploaded} uploaded, ${errors} skipped.` });
    loadProducts();
  };

  const activeCategories = categories.filter(c => c.is_active);

  const statusPillColor = (status) => pillColors[status] || pillColors.pending;

  // ---- Not logged in ----
  if (!session) {
    return (
      <div style={s.body}>
        <header style={s.header}>
          <div>
            <div style={s.brand}>The <em style={s.brandEm}>Style Katha</em></div>
            <div style={s.sub}>Collection & Orders Admin</div>
          </div>
          <div style={s.headerRight}>
            <a href="/" style={s.headerLink}>{'\u2190'} Back to site</a>
          </div>
        </header>
        <main style={s.main}>
          <div style={s.cardPanel}>
            <h2 style={s.cardPanelH2}>Sign in</h2>
            <p style={s.panelHint}>
              Sign in with the admin account you created in Supabase (Authentication {'\u2192'} Users).
              This page only shows product &amp; order management once you're authenticated.
            </p>
            <form onSubmit={handleLogin}>
              <div style={s.row}>
                <div>
                  <label style={s.label}>Email</label>
                  <input
                    type="email"
                    style={s.input}
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="admin@yourdomain.com"
                  />
                </div>
                <div>
                  <label style={s.label}>Password</label>
                  <input
                    type="password"
                    style={s.input}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  />
                </div>
              </div>
              <button type="submit" disabled={loginLoading} style={{ ...s.btn, opacity: loginLoading ? 0.5 : 1 }}>
                {loginLoading ? 'Signing in\u2026' : 'Sign In'}
              </button>
              <StatusBanner kind={loginStatus?.kind} msg={loginStatus?.msg} />
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ---- Logged in: Admin panel ----
  return (
    <div style={s.body}>
      <header style={s.header}>
        <div>
          <div style={s.brand}>The <em style={s.brandEm}>Style Katha</em></div>
          <div style={s.sub}>Collection & Orders Admin</div>
        </div>
        <div style={s.headerRight}>
          <span style={{ fontSize: 12, color: V.goldSoft }}>{session.user.email}</span>
          <button type="button" onClick={handleSignOut} style={{ ...s.btnSmall, border: `1px solid ${V.line}`, background: 'transparent', color: V.cream }}>Sign out</button>
          <a href="/" style={s.headerLink}>{'\u2190'} Back to site</a>
        </div>
      </header>

      <main style={s.main}>

        {/* ---- Add Product ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Add a piece</h2>
          <p style={s.panelHint}>
            Uploads the image to Supabase Storage and adds a row to the <code>products</code> table.
          </p>
          <form ref={addFormRef} onSubmit={handleAddProduct}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Name</label>
                <input type="text" required placeholder="e.g. Lyra Tennis Bracelet" style={s.input} value={addName} onChange={e => setAddName(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Category</label>
                <select required style={s.input} value={addCategory} onChange={e => setAddCategory(e.target.value)}>
                  <option value="">Select category\u2026</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={s.row3}>
              <div>
                <label style={s.label}>Price ({'\u20B9'})</label>
                <input type="number" required min="0" step="1" placeholder="3200" style={s.input} value={addPrice} onChange={e => setAddPrice(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Old price (optional)</label>
                <input type="number" min="0" step="1" placeholder="3800" style={s.input} value={addOldPrice} onChange={e => setAddOldPrice(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Badge (optional)</label>
                <select style={s.input} value={addBadge} onChange={e => setAddBadge(e.target.value)}>
                  {BADGES.map(b => (
                    <option key={b} value={b}>{b || 'None'}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={s.row3}>
              <div>
                <label style={s.label}>In Stock</label>
                <select style={s.input} value={addInStock} onChange={e => setAddInStock(e.target.value)}>
                  <option value="true">Yes</option>
                  <option value="false">No (Out of Stock)</option>
                </select>
              </div>
            </div>
            <label style={s.label}>Description (shown in quick view)</label>
            <textarea rows={3} placeholder="Short product description for customers" style={{ ...s.input, resize: 'vertical', fontFamily: "'Jost', sans-serif" }} value={addDesc} onChange={e => setAddDesc(e.target.value)} />
            <label style={s.label}>Features (one per line, shown in quick view)</label>
            <textarea rows={3} placeholder={'GIA Certified Diamond\n18k Gold Setting\nHandcrafted in Antwerp'} style={{ ...s.input, resize: 'vertical', fontFamily: "'Jost', sans-serif" }} value={addFeatures} onChange={e => setAddFeatures(e.target.value)} />
            <label style={s.label}>Product image</label>
            <input type="file" accept="image/*" required style={s.inputFile} onChange={e => setAddImage(e.target.files?.[0] || null)} />
            <button type="submit" disabled={addSubmitting} style={{ ...s.btn, opacity: addSubmitting ? 0.5 : 1 }}>
              {addSubmitting ? 'Publishing\u2026' : 'Publish to Collection'}
            </button>
            <StatusBanner kind={addStatus?.kind} msg={addStatus?.msg} />
          </form>
        </div>

        {/* ---- Bulk Upload ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Bulk Upload</h2>
          <p style={s.panelHint}>Select multiple images, fill in name & price for each, then upload all at once.</p>
          <div
            ref={bulkDropRef}
            style={s.dropZone}
            onClick={() => bulkFileInputRef.current?.click()}
            onDrop={handleBulkDrop}
            onDragOver={handleBulkDragOver}
            onDragLeave={handleBulkDragLeave}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={V.gold} strokeWidth="1.6" style={{ marginBottom: 8 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div style={{ fontSize: 14, color: V.cream, marginBottom: 4 }}>Click or drag images here</div>
            <div style={{ fontSize: 11, color: 'rgba(245,239,226,0.5)' }}>Select multiple product images at once</div>
            <input
              ref={bulkFileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
                if (files.length) addBulkFiles(files);
              }}
            />
          </div>

          {bulkItems.length > 0 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: V.goldSoft }}>Default Category</label>
                <select
                  style={{ ...s.input, marginBottom: 0 }}
                  value={bulkDefaultCat}
                  onChange={e => setBulkDefaultCat(e.target.value)}
                >
                  <option value="">Select category...</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {bulkItems.map(item => (
                <div key={item.idx} style={s.bulkItemRow}>
                  <img src={item.preview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateBulkItem(item.idx, 'name', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: `1px solid ${V.line}`, borderRadius: 4, fontSize: 13, marginBottom: 4, background: V.bgDark, color: V.cream, fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="Price"
                        min="0"
                        value={item.price}
                        onChange={e => updateBulkItem(item.idx, 'price', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: `1px solid ${V.line}`, borderRadius: 4, fontSize: 13, background: V.bgDark, color: V.cream, fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                      />
                      <input
                        type="number"
                        placeholder="Old price"
                        min="0"
                        value={item.oldPrice}
                        onChange={e => updateBulkItem(item.idx, 'oldPrice', e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: `1px solid ${V.line}`, borderRadius: 4, fontSize: 13, background: V.bgDark, color: V.cream, fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <select
                        value={item.category}
                        onChange={e => updateBulkItem(item.idx, 'category', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: `1px solid ${V.line}`, borderRadius: 4, fontSize: 13, background: V.bgDark, color: V.cream, fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                      >
                        <option value="">Select category...</option>
                        {activeCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <select
                        value={item.inStock}
                        onChange={e => updateBulkItem(item.idx, 'inStock', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: `1px solid ${V.line}`, borderRadius: 4, fontSize: 13, background: V.bgDark, color: V.cream, fontFamily: "'Jost', sans-serif", boxSizing: 'border-box' }}
                      >
                        <option value="true">In Stock</option>
                        <option value="false">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                disabled={bulkUploading}
                onClick={handleBulkUpload}
                style={{ ...s.btn, width: '100%', marginTop: 16, opacity: bulkUploading ? 0.5 : 1 }}
              >
                {bulkUploading ? 'Uploading\u2026' : `Upload All Products (${bulkFiles.length})`}
              </button>
            </>
          )}

          <StatusBanner kind={bulkStatus?.kind} msg={bulkStatus?.msg} />
        </div>

        {/* ---- Categories ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Categories</h2>
          <p style={s.panelHint}>Manage product categories. These appear in the site navigation and filter the collection.</p>
          <form ref={catFormRef} onSubmit={handleAddCategory} style={{ marginBottom: 20 }}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Name</label>
                <input type="text" required placeholder="e.g. Rings" style={s.input} value={catName} onChange={e => setCatName(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Slug (URL)</label>
                <input type="text" required placeholder="e.g. rings" style={s.input} value={catSlug} onChange={e => setCatSlug(e.target.value)} />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Sort Order</label>
                <input type="number" min="0" style={s.input} value={catOrder} onChange={e => setCatOrder(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select style={s.input} value={catActive} onChange={e => setCatActive(e.target.value)}>
                  <option value="true">Active</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>
            <div>
              <label style={s.label}>Description (optional)</label>
              <input type="text" placeholder="Short description for internal use" style={s.input} value={catDesc} onChange={e => setCatDesc(e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Category Icon Image</label>
              <input type="file" accept="image/*" style={s.inputFile} onChange={handleCatIconChange} />
              {catIconPreview && (
                <div style={{ marginTop: 6 }}>
                  <img src={catIconPreview} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
              )}
            </div>
            <button type="submit" disabled={catSubmitting} style={{ ...s.btn, opacity: catSubmitting ? 0.5 : 1 }}>
              {catSubmitting ? 'Adding\u2026' : 'Add Category'}
            </button>
            <StatusBanner kind={catStatus?.kind} msg={catStatus?.msg} />
          </form>

          <div>
            {categories.length === 0 ? (
              <div style={s.emptyState}>Loading\u2026</div>
            ) : categories.length === 0 ? (
              <div style={s.emptyState}>No categories yet.</div>
            ) : (
              categories.map(c => (
                <div key={c.id} style={s.productRow}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {c.icon ? (
                      <img src={c.icon} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 10, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>+</div>
                    )}
                    <div style={s.productRowInfo}>
                      <div style={s.productRowName}>{c.name || '(untitled)'}</div>
                      <div style={s.productRowMeta}>Slug: {c.slug || ''} {'\u00B7'} Order: {c.sort_order || 0} {'\u00B7'} {c.is_active ? 'Active' : 'Hidden'}</div>
                    </div>
                  </div>
                  <button type="button" style={s.btnSmall} onClick={() => openEditCategory(c)}>Edit</button>
                  <button type="button" style={s.btnDanger} onClick={() => deleteCategory(c.id)}>Delete</button>
                </div>
              ))
            )}
          </div>
          <StatusBanner kind={catListStatus?.kind} msg={catListStatus?.msg} />
        </div>

        {/* ---- Site Settings ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Site Settings</h2>
          <p style={s.panelHint}>Manage contact information displayed on the website.</p>
          <form onSubmit={handleSaveSettings}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Contact Phone (with country code, no +)</label>
                <input type="text" required placeholder="e.g. 91123456789" pattern="[0-9]+" maxLength={15} style={s.input} value={settingsPhone} onChange={e => setSettingsPhone(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Display Format</label>
                <input type="text" placeholder="e.g. +91 12345 67890" style={s.input} value={settingsPhoneDisplay} onChange={e => setSettingsPhoneDisplay(e.target.value)} />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>WhatsApp Number (with country code, no +)</label>
                <input type="text" placeholder="e.g. 91123456789" pattern="[0-9]+" maxLength={15} style={s.input} value={settingsWhatsApp} onChange={e => setSettingsWhatsApp(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Contact Email</label>
                <input type="email" placeholder="support@example.com" style={s.input} value={settingsEmail} onChange={e => setSettingsEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={settingsSubmitting} style={{ ...s.btn, opacity: settingsSubmitting ? 0.5 : 1 }}>
              {settingsSubmitting ? 'Saving\u2026' : 'Save Settings'}
            </button>
            <StatusBanner kind={settingsStatus?.kind} msg={settingsStatus?.msg} />
          </form>
        </div>

        {/* ---- Product List ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Current collection</h2>
          <button type="button" onClick={loadProducts} style={{ ...s.btnGhost, marginBottom: 14 }}>Refresh</button>
          <div>
            {productsLoading ? (
              <div style={s.emptyState}>Loading\u2026</div>
            ) : products.length === 0 ? (
              <div style={s.emptyState}>No products yet.</div>
            ) : (
              products.map(p => {
                const stockBadge = p.in_stock === false ? (
                  <span style={{ color: V.danger, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out of Stock{' '}</span>
                ) : null;
                return (
                  <div key={p.id} style={s.productRow}>
                    <img
                      src={p.image_url}
                      alt=""
                      style={s.productRowImg}
                      onError={e => { e.target.src = '/assets/collections/ring.jpg'; }}
                    />
                    <div style={s.productRowInfo}>
                      <div style={s.productRowName}>
                        {stockBadge}
                        {p.name || '(untitled)'}
                      </div>
                      <div style={s.productRowMeta}>
                        {p.category || ''} {'\u00B7'} {fmtMoney(p.price != null ? p.price : 0)}
                      </div>
                    </div>
                    <button type="button" style={s.btnSmall} onClick={() => openEditProduct(p)}>Edit</button>
                    <button type="button" style={s.btnDanger} onClick={() => deleteProduct(p.id)}>Delete</button>
                  </div>
                );
              })
            )}
          </div>
          <StatusBanner kind={listStatus?.kind} msg={listStatus?.msg} />
        </div>

        {/* ---- Orders ---- */}
        <div style={s.cardPanel}>
          <h2 style={s.cardPanelH2}>Orders</h2>
          <p style={s.panelHint}>
            Live from the <code>orders</code> table. New orders appear automatically without a refresh.
          </p>
          <button type="button" onClick={loadOrders} style={{ ...s.btnGhost, marginBottom: 14 }}>Refresh</button>
          <div>
            {ordersLoading ? (
              <div style={s.emptyState}>Loading\u2026</div>
            ) : orders.length === 0 ? (
              <div style={s.emptyState}>No orders yet.</div>
            ) : (
              orders.map(o => {
                const items = Array.isArray(o.items) ? o.items : [];
                const waNumber = (o.customer_mobile || '').replace(/[^0-9]/g, '');
                const statusColor = statusPillColor(o.status);

                return (
                  <div key={o.id} style={{ ...s.orderRow, marginBottom: 10 }}>
                    <div style={s.orderHead}>
                      <div style={s.orderCust}>
                        {o.customer_name || 'Unknown'}
                        <span style={s.orderId}>{o.order_id || ''}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={s.orderTotal}>{fmtMoney(o.total)}</div>
                        <span style={{ ...s.statusPill, color: statusColor.color, borderColor: statusColor.borderColor }}>{o.status}</span>
                      </div>
                    </div>
                    <div style={s.orderMeta}>{fmtDate(o.created_at)}</div>
                    <div style={s.orderDetails}>
                      <div>
                        <span style={s.orderDetailLabel}>Mobile</span>
                        <span style={s.orderDetailValue}>
                          {waNumber ? (
                            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" style={{ color: V.goldSoft, textDecoration: 'none' }}>
                              {o.customer_mobile} {'\u2197'}
                            </a>
                          ) : (o.customer_mobile || '\u2014')}
                        </span>
                      </div>
                      <div>
                        <span style={s.orderDetailLabel}>Alternative Mobile</span>
                        <span style={s.orderDetailValue}>{o.customer_alt_mobile || '\u2014'}</span>
                      </div>
                      <div style={s.orderDetailFull}>
                        <span style={s.orderDetailLabel}>Address</span>
                        <span style={s.orderDetailValue}>{o.address || '\u2014'}</span>
                      </div>
                      <div>
                        <span style={s.orderDetailLabel}>Mandal</span>
                        <span style={s.orderDetailValue}>{o.mandal || '\u2014'}</span>
                      </div>
                      <div>
                        <span style={s.orderDetailLabel}>District</span>
                        <span style={s.orderDetailValue}>{o.district || '\u2014'}</span>
                      </div>
                    </div>
                    <div style={s.orderItems}>
                      {items.map((it, idx) => (
                        <div key={idx} style={{ ...s.orderItemRow, borderBottom: idx === items.length - 1 ? 'none' : `1px dashed ${V.line}` }}>
                          <span>{it.name || ''}</span>
                          <span>{fmtMoney(it.price || 0)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <select
                        value={o.status}
                        onChange={e => updateOrderStatus(o.id, e.target.value)}
                        style={{ ...s.input, marginBottom: 0, width: 'auto', padding: '6px 10px', fontSize: 12 }}
                      >
                        {STATUSES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <StatusBanner kind={orderStatusMsg?.kind} msg={orderStatusMsg?.msg} />
        </div>

      </main>

      {/* ---- Edit Product Modal ---- */}
      {editProduct && (
        <div style={s.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeEditProduct(); }}>
          <div style={s.modalContent}>
            <h3 style={s.modalH3}>Edit Product</h3>
            <div style={{ fontSize: 13, color: 'rgba(245,239,226,0.5)', marginBottom: 16 }}>{editProduct.name}</div>

            {editProduct.image_url && (
              <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 12 }}>
                <img src={editProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <label style={s.label}>Change Image (optional)</label>
            <input type="file" accept="image/*" style={{ ...s.inputFile, marginBottom: 12 }} onChange={e => setEditImageFile(e.target.files?.[0] || null)} />

            <label style={s.label}>Description</label>
            <textarea
              rows={3}
              style={{ ...s.input, resize: 'vertical', fontFamily: "'Jost', sans-serif", marginBottom: 12 }}
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
            />

            <label style={{ ...s.label, margin: '12px 0 4px' }}>Features (one per line)</label>
            <textarea
              rows={4}
              style={{ ...s.input, resize: 'vertical', fontFamily: "'Jost', sans-serif", marginBottom: 12 }}
              value={editFeatures}
              onChange={e => setEditFeatures(e.target.value)}
            />

            <label style={{ ...s.label, margin: '12px 0 4px' }}>In Stock</label>
            <select
              style={{ ...s.input, marginBottom: 16 }}
              value={editInStock}
              onChange={e => setEditInStock(e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No (Out of Stock)</option>
            </select>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={closeEditProduct} style={{ flex: 1, padding: 10, border: `1px solid ${V.line}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13, color: V.cream, fontFamily: "'Jost', sans-serif" }}>
                Cancel
              </button>
              <button type="button" disabled={editSaving} onClick={saveEditProduct} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 6, background: V.gold, color: V.bgDark, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Jost', sans-serif", opacity: editSaving ? 0.5 : 1 }}>
                {editSaving ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
            {editStatus && (
              <div style={{ fontSize: 12, marginTop: 10, color: editStatus.kind === 'ok' ? V.ok : editStatus.kind === 'err' ? V.danger : V.goldSoft }}>
                {editStatus.msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Edit Category Modal ---- */}
      {editCatData && (
        <div style={s.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeEditCategory(); }}>
          <div style={s.modalContent}>
            <h3 style={s.modalH3}>Edit Category</h3>
            <div style={{ fontSize: 12, color: 'rgba(245,239,226,0.45)', marginBottom: 16 }}>ID: {editCatData.id}</div>

            {editCatData.icon && (
              <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 12, border: `1px solid ${V.line}` }}>
                <img src={editCatData.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <label style={s.label}>Name</label>
            <input type="text" style={{ ...s.input, marginBottom: 12 }} value={editCatName} onChange={e => setEditCatName(e.target.value)} />

            <label style={s.label}>Slug</label>
            <input type="text" style={{ ...s.input, marginBottom: 12 }} value={editCatSlug} onChange={e => setEditCatSlug(e.target.value)} />

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Sort Order</label>
                <input type="number" min="0" style={{ ...s.input, marginBottom: 0 }} value={editCatOrder} onChange={e => setEditCatOrder(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Status</label>
                <select style={{ ...s.input, marginBottom: 0 }} value={editCatActive} onChange={e => setEditCatActive(e.target.value)}>
                  <option value="true">Active</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
            </div>

            <label style={s.label}>Description (optional)</label>
            <input type="text" style={{ ...s.input, marginBottom: 12 }} value={editCatDesc} onChange={e => setEditCatDesc(e.target.value)} />

            <label style={s.label}>Change Icon (optional)</label>
            <input type="file" accept="image/*" style={{ ...s.inputFile, marginBottom: 12 }} onChange={e => setEditCatIconFile(e.target.files?.[0] || null)} />

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={closeEditCategory} style={{ flex: 1, padding: 10, border: `1px solid ${V.line}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13, color: V.cream, fontFamily: "'Jost', sans-serif" }}>
                Cancel
              </button>
              <button type="button" disabled={editCatSaving} onClick={saveEditCategory} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 6, background: V.gold, color: V.bgDark, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Jost', sans-serif", opacity: editCatSaving ? 0.5 : 1 }}>
                {editCatSaving ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
            {editCatStatus && (
              <div style={{ fontSize: 12, marginTop: 10, color: editCatStatus.kind === 'ok' ? V.ok : editCatStatus.kind === 'err' ? V.danger : V.goldSoft }}>
                {editCatStatus.msg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
