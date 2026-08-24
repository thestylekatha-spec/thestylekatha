export function money(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

export function generateOrderId() {
  const now = new Date();
  const d = String(now.getFullYear()).slice(2) + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0');
  return 'SK' + d + '-' + Math.floor(1000 + Math.random() * 9000);
}
