const LOGO_PATH = 'assets/logo.gif';

function logoBrand(href) {
  return `<a class="navbar-brand navbar-logo mx-auto mx-lg-0" href="${href}"><img src="${LOGO_PATH}" alt="Monster GameStore"></a>`;
}

function renderCategoryMenuLevel(store, cats, parentId, depth = 1) {
  const visibleIds = new Set(cats.map((c) => c.id));
  return getSortedCategoryChildren(store, parentId)
    .filter((c) => visibleIds.has(c.id))
    .map((cat) => {
      const sub = getSortedCategoryChildren(store, cat.id).filter((c) => visibleIds.has(c.id));
      const isPlatform = depth === 1;

      if (isPlatform) {
        const leafLinks = sub
          .map((s) => `<li><a class="dropdown-item dropdown-item-leaf" href="index.html?cat=${encodeURIComponent(s.id)}">${escapeHtml(s.label)}</a></li>`)
          .join('');
        return `
        <li><h6 class="dropdown-header dropdown-header-platform"><a href="index.html?cat=${encodeURIComponent(cat.id)}">${escapeHtml(cat.label)}</a></h6></li>        
        ${leafLinks}`;
      }

      if (!sub.length) {
        return `<li><a class="dropdown-item dropdown-item-leaf" href="index.html?cat=${encodeURIComponent(cat.id)}">${escapeHtml(cat.label)}</a></li>`;
      }

      return `
        <li><h6 class="dropdown-header dropdown-header-platform"><a href="index.html?cat=${encodeURIComponent(cat.id)}">${escapeHtml(cat.label)}</a></h6></li>        
        ${renderCategoryMenuLevel(store, cats, cat.id, depth + 1)}`;
    })
    .join('');
}

function buildProdutosDropdownItems(store) {
  const cats = getVisibleCategories(store);
  const visibleIds = new Set(cats.map((c) => c.id));
  const roots = getSortedCategoryChildren(store, null).filter((c) => visibleIds.has(c.id));

  if (!roots.length) {
    return cats
      .map((c) => {
        const path = getCategoryPath(store, c.id).join(' › ');
        return `<li><a class="dropdown-item dropdown-item-leaf" href="index.html?cat=${encodeURIComponent(c.id)}">${escapeHtml(path)}</a></li>`;
      })
      .join('');
  }

  return roots
    .map((root, index) => {
      const body = renderCategoryMenuLevel(store, cats, root.id);
      const divider = index > 0 ? '<li><hr class="dropdown-divider"></li>' : '';

      if (body) {
        return `${divider}<li><h6 class="dropdown-header dropdown-header-root">${escapeHtml(root.label)}</h6></li>${body}`;
      }

      return `${divider}<li><a class="dropdown-item dropdown-item-leaf" href="index.html?cat=${encodeURIComponent(root.id)}">${escapeHtml(root.label)}</a></li>`;
    })
    .join('');
}

function renderNavbar(activePage) {
  const store = getStore();
  const produtosItems = buildProdutosDropdownItems(store);
  const produtosMenu = produtosItems
    ? `<li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle ${activePage === 'produtos' || activePage === 'jogos' ? 'active' : ''}" href="#" data-bs-toggle="dropdown" role="button">Produtos</a>
        <ul class="dropdown-menu dropdown-menu-mgs">${produtosItems}</ul>
       </li>`
    : '';

  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `    
    <header class="site-header sticky-top">
      <nav class="navbar navbar-expand-lg navbar-mgs">
        <div class="container">
          ${logoBrand('index.html')}
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-label="Menu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navMain">
            <ul class="navbar-nav mx-lg-auto">
              <li class="nav-item"><a class="nav-link ${activePage === 'inicio' ? 'active' : ''}" href="index.html">Início</a></li>
              ${produtosMenu}
              <li class="nav-item"><a class="nav-link ${activePage === 'contato' ? 'active' : ''}" href="contato.html">Contato</a></li>
              <li class="nav-item"><a class="nav-link ${activePage === 'quem-somos' ? 'active' : ''}" href="quem-somos.html">Quem Somos</a></li>
            </ul>
          </div>
        </div>
      </nav>
    </header>`;
}

function renderFooter() {
  const el = document.getElementById('footer');
  if (!el) return;

  el.innerHTML = `
    <footer class="site-footer">
      <div class="container text-center">
        <div class="footer-social">
          <a href="https://www.facebook.com/monstergamestore1/" target="_blank" rel="noopener" aria-label="Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
          </a>
          <a href="https://instagram.com/monstergamestore" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>
        <p class="footer-copy mb-0">&copy; ${new Date().getFullYear()} Monster GameStore — Todos os direitos reservados.</p>
      </div>
    </footer>`;
}

function renderWhatsAppFloat() {
  if (document.getElementById('whatsapp-float')) return;

  const link = document.createElement('a');
  link.id = 'whatsapp-float';
  link.className = 'whatsapp-float';
  link.href = getWhatsAppContactUrl();
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'Contato via WhatsApp');
  link.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>`;
  document.body.appendChild(link);
}

function getDisplayName(p, store) {
  store = store || getStore();
  const path = getCategoryPath(store, p.categoryId);
  const leaf = path[path.length - 1] || '';
  const parent = path[path.length - 2] || '';
  let suffix = '';

  if (/playstation\s*5|ps5/i.test(parent)) suffix = ' [PS5]';
  else if (/playstation\s*4|ps4/i.test(parent)) suffix = ' [PS4]';
  else if (parent) suffix = ` [${parent}]`;

  if (/usados?/i.test(leaf)) suffix += ' - Usado';

  return `${p.name}${suffix}`;
}

function productCardHtml(p) {
  const displayName = getDisplayName(p);
  const safeName = escapeHtml(displayName);
  const productId = encodeURIComponent(p.id);
  const image = escapeAttr(safeImageUrl(p.image));
  const buyUrl = escapeAttr(getProductBuyUrl(p));

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <article class="product-item">
        <div class="product-item-image-wrap">          
          <a href="produto.html?id=${productId}">
            <img src="${image}" alt="${safeName}" loading="lazy">
          </a>
        </div>
        <div class="product-item-body">
          <h3 class="product-item-title">
            <a href="produto.html?id=${productId}">${safeName}</a>
          </h3>
          
          <div class="product-prices">            
            <span class="product-price-current">${formatPrice(p.price)}</span>
          </div>
          <div class="product-actions">
            <a href="produto.html?id=${productId}" class="btn btn-details">Detalhes</a>
            <a href="${buyUrl}" class="btn btn-buy-now" target="_blank" rel="noopener noreferrer">Comprar</a>
          </div>
        </div>
      </article>
    </div>`;
}

function renderProducts(containerId, filterCatId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const store = getStore();
  const visibleCats = new Set(getVisibleCategories(store).map((c) => c.id));

  let products = store.products.filter((p) => p.visible && visibleCats.has(p.categoryId));

  const titleEl = document.getElementById('category-title');

  if (filterCatId) {
    const descendantIds = new Set(getCategoryDescendants(store, filterCatId));
    products = products.filter((p) => descendantIds.has(p.categoryId));
    if (titleEl) {
      const cat = store.categories.find((c) => c.id === filterCatId);
      titleEl.textContent = cat ? getCategoryPath(store, filterCatId).join(' › ') : 'Produtos';
    }
  } else if (titleEl) {
    titleEl.textContent = 'Produtos em destaque';
  }

  if (!products.length) {
    el.innerHTML = '<div class="col-12 empty-state"><p>Nenhum produto disponível nesta categoria.</p></div>';
    return;
  }

  el.innerHTML = products.map((p) => productCardHtml(p)).join('');
}

function renderProductDetail(product) {
  const displayName = getDisplayName(product);
  const safeName = escapeHtml(displayName);
  const store = getStore();
  const path = escapeHtml(getCategoryPath(store, product.categoryId).join(' › '));
  const image = escapeAttr(safeImageUrl(product.image));
  const buyUrl = escapeAttr(getProductBuyUrl(product));

  return `
    <div class="row g-4 align-items-start">
      <div class="col-md-5">
        <div class="product-detail-img-wrap position-relative">          
          <img src="${image}" alt="${safeName}" class="product-detail-img">
        </div>
      </div>
      <div class="col-md-7 product-detail-info">
        <h1 class="h3 fw-bold mb-3">${safeName}</h1>        
        <div class="product-prices mb-3">          
          <span class="product-price-current d-block">${formatPrice(product.price)}</span>
        </div>
        <p class="text-muted">${escapeHtml(product.shortDesc)}</p>
        <hr>
        <h5 class="fw-bold">Descrição</h5>
        <p class="text-muted">${escapeHtml(product.description)}</p>
        <div class="product-actions d-flex flex-wrap gap-2 mt-4" style="max-width:400px">
          <a href="${buyUrl}" class="btn btn-buy-now flex-grow-1" target="_blank" rel="noopener noreferrer">Comprar</a>
        </div>
        <p class="small text-muted mt-3 mb-0">Categoria: ${path}</p>
      </div>
    </div>`;
}

function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function initSite(activePage) {
  return initStore().then(() => {
    renderNavbar(activePage);
    renderFooter();
    renderWhatsAppFloat();    
  });
}
