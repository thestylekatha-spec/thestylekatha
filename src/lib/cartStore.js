const KEY = 'sk_cart_v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list || [])); } catch {}
  window.dispatchEvent(new Event('storage'));
}

export const cartStore = {
  get: read,
  set: write,
  count: () => read().reduce((n, i) => n + (i.qty || 1), 0),
  add(item, qty = 1) {
    const list = read();
    const q = Math.max(1, parseInt(qty, 10));
    const found = list.find(i => String(i.id) === String(item.id) && String(i.customName || '') === String(item.customName || ''));
    if (found) found.qty = (found.qty || 1) + q;
    else list.push({ id: item.id, name: item.name, cat: item.cat || '', price: Number(item.price) || 0, image: item.image || '', customName: item.customName || '', qty: q });
    write(list);
    return list;
  },
  updateQty(idx, delta) {
    const list = read();
    if (!list[idx]) return list;
    list[idx].qty += delta;
    if (list[idx].qty <= 0) list.splice(idx, 1);
    write(list);
    return list;
  },
  remove(idx) {
    const list = read();
    list.splice(idx, 1);
    write(list);
    return list;
  },
  clear: () => write([]),
};
