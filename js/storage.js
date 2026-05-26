const CATALOG_VERSION = 3;
const CATALOG_API = `${location.pathname.includes('/admin-monster/') ? '..' : '.'}/api/catalog.php`;
const UPLOAD_API = `${location.pathname.includes('/admin-monster/') ? '..' : '.'}/api/upload.php`;

let _storeCache = null;
let _storeInitPromise = null;

const EMPTY_STORE = { catalogVersion: CATALOG_VERSION, categories: [], products: [] };

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function safeImageUrl(url) {
  const value = String(url || '');
  if (/^assets\/[a-zA-Z0-9/_.-]+$/.test(value) || /^https?:\/\//i.test(value)) {
    return value;
  }
  return 'assets/logo.gif';
}

function getCategoryChildren(store, parentId) {
  return store.categories.filter((c) => c.parent === parentId);
}

function compareCategoryOrder(a, b) {
  const orderA = a.order ?? 0;
  const orderB = b.order ?? 0;
  if (orderA !== orderB) return orderA - orderB;
  return a.label.localeCompare(b.label, 'pt-BR');
}

function getSortedCategoryChildren(store, parentId) {
  return getCategoryChildren(store, parentId).sort(compareCategoryOrder);
}

function ensureCategoryOrders(categories) {
  const byParent = {};
  categories.forEach((c) => {
    const key = c.parent || '__root__';
    (byParent[key] ||= []).push(c);
  });
  Object.values(byParent).forEach((siblings) => {
    siblings.sort(compareCategoryOrder);
    siblings.forEach((c, i) => {
      if (c.order == null) c.order = i;
    });
  });
  return categories;
}

function getCategoryDescendants(store, catId) {
  const ids = [catId];
  getCategoryChildren(store, catId).forEach((child) => {
    ids.push(...getCategoryDescendants(store, child.id));
  });
  return ids;
}

function getLeafCategories(store) {
  return store.categories.filter((c) => !store.categories.some((x) => x.parent === c.id));
}

function sortCategoriesTree(categories) {
  const byParent = {};
  categories.forEach((c) => {
    const key = c.parent || '__root__';
    (byParent[key] ||= []).push(c);
  });
  Object.values(byParent).forEach((arr) => arr.sort(compareCategoryOrder));
  const result = [];
  function walk(parentId) {
    (byParent[parentId || '__root__'] || []).forEach((c) => {
      result.push(c);
      walk(c.id);
    });
  }
  walk(null);
  return result;
}

function slugifyCategoryId(text) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`
  );
}

function ensureUniqueCategoryId(store, baseId, excludeId) {
  let id = baseId;
  let n = 1;
  while (store.categories.some((c) => c.id === id && c.id !== excludeId)) {
    id = `${baseId}-${++n}`;
  }
  return id;
}

function normalizeStore(data) {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
    return structuredClone(EMPTY_STORE);
  }
  return {
    catalogVersion: CATALOG_VERSION,
    categories: ensureCategoryOrders(data.categories.map((c) => ({ ...c }))),
    products: data.products
  };
}

function initStore() {
  if (!_storeInitPromise) {
    _storeInitPromise = fetch(CATALOG_API)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar catálogo');
        return res.json();
      })
      .then((data) => {
        _storeCache = normalizeStore(data);
        return _storeCache;
      })
      .catch(() => {
        _storeCache = structuredClone(EMPTY_STORE);
        return _storeCache;
      });
  }
  return _storeInitPromise;
}

function getStore() {
  return _storeCache || structuredClone(EMPTY_STORE);
}

async function uploadProductImage(categoryId, file, productName) {
  const formData = new FormData();
  formData.append('categoryId', categoryId);
  formData.append('productName', productName || 'produto');
  formData.append('image', file);

  const res = await fetch(UPLOAD_API, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar imagem');
  }

  return data.path;
}

async function saveStore(data) {
  data.catalogVersion = CATALOG_VERSION;
  const res = await fetch(CATALOG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao salvar catálogo');
  }

  _storeCache = normalizeStore(data);
  return _storeCache;
}

function getCategoryAssetPath(store, categoryId) {
  const map = Object.fromEntries(store.categories.map((c) => [c.id, c]));
  const chain = [];
  let cur = map[categoryId];
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent ? map[cur.parent] : null;
  }
  if (chain.length > 1 && chain[0].parent === null) {
    chain.shift();
  }
  return chain.map(categoryAssetSegment).filter(Boolean).join('/');
}

function categoryAssetSegment(cat) {
  const label = String(cat.label || '').trim();
  const id = String(cat.id || '');
  if (id === 'ps4' || /playstation\s*4|^ps4$/i.test(label)) return 'PS4';
  if (id === 'ps5' || /playstation\s*5|^ps5$/i.test(label)) return 'PS5';
  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
  return normalized || 'outros';
}

function getCategoryPath(store, catId) {
  const map = Object.fromEntries(store.categories.map((c) => [c.id, c]));
  const parts = [];
  let cur = map[catId];
  while (cur) {
    parts.unshift(cur.label);
    cur = cur.parent ? map[cur.parent] : null;
  }
  return parts;
}

function getVisibleCategories(store) {
  const map = Object.fromEntries(store.categories.map((c) => [c.id, c]));
  function isVisible(id) {
    const cat = map[id];
    if (!cat || !cat.visible) return false;
    return !cat.parent || isVisible(cat.parent);
  }
  return store.categories.filter((c) => isVisible(c.id));
}

const WHATSAPP_NUMBER = '1234567890';

function getProductBuyUrl(product) {
  const type = product.buyType || 'whatsapp';
  if (type === 'url' && product.buyUrl && /^https?:\/\//i.test(product.buyUrl)) {
    return product.buyUrl;
  }
  const message = `Olá gostaria de comprar ${product.name}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getWhatsAppContactUrl() {
  const message = 'Olá! Vim pelo site Monster GameStore e gostaria de mais informações.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
