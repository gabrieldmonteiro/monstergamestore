(function () {
  let editingCategoryId = null;
  const productModal = new bootstrap.Modal(document.getElementById('productModal'));
  const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));

  function switchPanel(name) {
    document.querySelectorAll('[data-panel]').forEach((link) => {
      link.classList.toggle('active', link.dataset.panel === name);
    });
    document.getElementById('panel-products').classList.toggle('d-none', name !== 'products');
    document.getElementById('panel-categories').classList.toggle('d-none', name !== 'categories');
  }

  function fillCategorySelect() {
    const store = getStore();
    const sel = document.getElementById('product-category');
    const leaves = getLeafCategories(store).sort((a, b) => {
      const parentA = store.categories.find((c) => c.id === a.parent);
      const parentB = store.categories.find((c) => c.id === b.parent);
      if (parentA && parentB && parentA.id !== parentB.id) return compareCategoryOrder(parentA, parentB);
      return compareCategoryOrder(a, b);
    });
    sel.innerHTML = leaves
      .map((c) => {
        const path = getCategoryPath(store, c.id).join(' › ');
        return `<option value="${escapeAttr(c.id)}">${escapeHtml(path)}</option>`;
      })
      .join('');
  }

  function fillParentSelect(excludeId) {
    const store = getStore();
    const sel = document.getElementById('category-parent');
    const exclude = new Set(excludeId ? getCategoryDescendants(store, excludeId) : []);
    const sorted = sortCategoriesTree(store.categories).filter((c) => !exclude.has(c.id));

    sel.innerHTML =
      '<option value="">— Nenhuma (categoria raiz) —</option>' +
      sorted
        .map((c) => {
          const depth = getCategoryPath(store, c.id).length - 1;
          const indent = '— '.repeat(depth);
          return `<option value="${escapeAttr(c.id)}">${escapeHtml(indent + c.label)}</option>`;
        })
        .join('');
  }

  function renderProductsTable() {
    const store = getStore();
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = store.products
      .map((p) => {
        const path = getCategoryPath(store, p.categoryId).join(' › ') || '—';
        const rowClass = p.visible ? '' : 'visibility-off';
        return `<tr class="${rowClass}">
          <td><img src="${escapeAttr(safeImageUrl(p.image))}" alt=""></td>
          <td>${escapeHtml(p.name)}</td>
          <td><small>${escapeHtml(path)}</small></td>
          <td>${formatPrice(p.price)}</td>
          <td>
            <div class="form-check form-switch">
              <input class="form-check-input toggle-product-vis" type="checkbox" data-id="${escapeAttr(p.id)}" ${p.visible ? 'checked' : ''}>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary btn-edit-product" data-id="${escapeAttr(p.id)}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete-product" data-id="${escapeAttr(p.id)}">Excluir</button>
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.btn-edit-product').forEach((btn) =>
      btn.addEventListener('click', () => openProductForm(btn.dataset.id))
    );
    tbody.querySelectorAll('.btn-delete-product').forEach((btn) =>
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id))
    );
    tbody.querySelectorAll('.toggle-product-vis').forEach((input) =>
      input.addEventListener('change', () => toggleProductVisibility(input.dataset.id, input.checked))
    );
  }

  function renderCategoriesTable() {
    const store = getStore();
    const tbody = document.getElementById('categories-tbody');
    const sorted = sortCategoriesTree(store.categories);

    tbody.innerHTML = sorted
      .map((cat) => {
        const depth = getCategoryPath(store, cat.id).length - 1;
        const path = getCategoryPath(store, cat.id).join(' › ');
        const parent = cat.parent
          ? store.categories.find((c) => c.id === cat.parent)?.label || cat.parent
          : '—';
        const productCount = store.products.filter((p) => p.categoryId === cat.id).length;
        const childCount = getCategoryChildren(store, cat.id).length;
        const rowClass = cat.visible ? '' : 'visibility-off';
        const siblings = getSortedCategoryChildren(store, cat.parent);
        const sibIdx = siblings.findIndex((c) => c.id === cat.id);
        const canUp = sibIdx > 0;
        const canDown = sibIdx >= 0 && sibIdx < siblings.length - 1;

        return `<tr class="${rowClass}" data-id="${escapeAttr(cat.id)}">
          <td>
            <div class="category-order-btns">
              <button type="button" class="btn btn-outline-secondary btn-cat-up" data-id="${escapeAttr(cat.id)}" ${canUp ? '' : 'disabled'} aria-label="Subir">▲</button>
              <button type="button" class="btn btn-outline-secondary btn-cat-down" data-id="${escapeAttr(cat.id)}" ${canDown ? '' : 'disabled'} aria-label="Descer">▼</button>
            </div>
          </td>
          <td style="padding-left:${12 + depth * 20}px"><strong>${escapeHtml(cat.label)}</strong><br><small class="text-muted">${escapeHtml(path)}</small></td>
          <td><code>${escapeHtml(cat.id)}</code></td>
          <td>${escapeHtml(parent)}</td>
          <td>${productCount}</td>
          <td>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input toggle-cat-vis" type="checkbox" data-id="${escapeAttr(cat.id)}" ${cat.visible ? 'checked' : ''}>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary btn-edit-category" data-id="${escapeAttr(cat.id)}">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete-category" data-id="${escapeAttr(cat.id)}" ${childCount ? 'disabled title="Exclua subcategorias primeiro"' : ''}>Excluir</button>
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll('.btn-edit-category').forEach((btn) =>
      btn.addEventListener('click', () => openCategoryForm(btn.dataset.id))
    );
    tbody.querySelectorAll('.btn-delete-category').forEach((btn) =>
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id))
    );
    tbody.querySelectorAll('.toggle-cat-vis').forEach((input) =>
      input.addEventListener('change', () => toggleCategoryVisibility(input.dataset.id, input.checked))
    );
    tbody.querySelectorAll('.btn-cat-up').forEach((btn) =>
      btn.addEventListener('click', () => moveCategory(btn.dataset.id, 'up'))
    );
    tbody.querySelectorAll('.btn-cat-down').forEach((btn) =>
      btn.addEventListener('click', () => moveCategory(btn.dataset.id, 'down'))
    );
  }

  async function persistStore(store) {
    try {
      await saveStore(store);
    } catch (err) {
      alert(err.message || 'Falha ao salvar. Tente novamente.');
      throw err;
    }
  }

  async function moveCategory(id, direction) {
    const store = getStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return;

    const siblings = getSortedCategoryChildren(store, cat.parent);
    const idx = siblings.findIndex((c) => c.id === id);
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= siblings.length) return;

    [siblings[idx], siblings[swapWith]] = [siblings[swapWith], siblings[idx]];
    siblings.forEach((c, i) => {
      c.order = i;
    });

    await persistStore(store);
    renderCategoriesTable();
  }

  function resolveAdminImageSrc(src) {
    if (!src) return '';
    if (src.startsWith('blob:')) return src;
    if (src.startsWith('assets/')) return `../${src}`;
    return src;
  }

  function updateProductImageHint() {
    const catId = document.getElementById('product-category').value;
    const hint = document.getElementById('product-image-hint');
    if (!catId) {
      hint.textContent = 'Selecione a categoria para ver a pasta de destino.';
      return;
    }
    const assetPath = getCategoryAssetPath(getStore(), catId);
    hint.textContent = assetPath
      ? `A imagem será salva em assets/${assetPath}/`
      : 'Não foi possível determinar a pasta da categoria.';
  }

  function updateProductImagePreview(src) {
    const el = document.getElementById('product-image-preview');
    if (!src) {
      el.innerHTML = '';
      return;
    }
    const resolved = resolveAdminImageSrc(src);
    el.innerHTML = `<img src="${escapeAttr(resolved)}" alt="Prévia da imagem" class="product-image-preview-img">`;
  }

  function toggleBuyUrlField() {
    const type = document.getElementById('product-buy-type').value;
    const wrap = document.getElementById('product-buy-url-wrap');
    const input = document.getElementById('product-buy-url');
    const showUrl = type === 'url';
    wrap.classList.toggle('d-none', !showUrl);
    input.required = showUrl;
  }

  function openProductForm(id) {
    fillCategorySelect();
    const form = document.getElementById('product-form');
    form.reset();
    document.getElementById('product-image-file').value = '';
    document.getElementById('productModalTitle').textContent = id ? 'Editar produto' : 'Novo produto';

    if (id) {
      const p = getStore().products.find((x) => x.id === id);
      if (!p) return;
      document.getElementById('product-id').value = p.id;
      document.getElementById('product-name').value = p.name;
      document.getElementById('product-price').value = p.price;
      document.getElementById('product-category').value = p.categoryId;
      document.getElementById('product-image').value = p.image;
      document.getElementById('product-short').value = p.shortDesc;
      document.getElementById('product-desc').value = p.description;
      document.getElementById('product-buy-type').value = p.buyType || 'whatsapp';
      document.getElementById('product-buy-url').value = p.buyUrl || '';
      document.getElementById('product-visible').checked = p.visible;
      updateProductImagePreview(p.image);
    } else {
      document.getElementById('product-id').value = '';
      document.getElementById('product-image').value = '';
      document.getElementById('product-buy-type').value = 'whatsapp';
      document.getElementById('product-buy-url').value = '';
      document.getElementById('product-visible').checked = true;
      updateProductImagePreview('');
    }

    updateProductImageHint();
    toggleBuyUrlField();
    productModal.show();
  }

  function openCategoryForm(id) {
    const form = document.getElementById('category-form');
    form.reset();
    editingCategoryId = id || null;
    fillParentSelect(id);

    const idField = document.getElementById('category-id');
    const idWrap = document.getElementById('category-id-wrap');
    document.getElementById('categoryModalTitle').textContent = id ? 'Editar categoria' : 'Nova categoria';

    if (id) {
      const cat = getStore().categories.find((c) => c.id === id);
      if (!cat) return;
      idField.value = cat.id;
      idField.readOnly = true;
      idWrap.classList.remove('d-none');
      document.getElementById('category-label').value = cat.label;
      document.getElementById('category-parent').value = cat.parent || '';
      document.getElementById('category-visible').checked = cat.visible;
    } else {
      idField.value = '';
      idField.readOnly = false;
      idWrap.classList.add('d-none');
      document.getElementById('category-visible').checked = true;
    }

    categoryModal.show();
  }

  async function saveProduct(e) {
    e.preventDefault();
    const buyType = document.getElementById('product-buy-type').value;
    const buyUrl = document.getElementById('product-buy-url').value.trim();
    if (buyType === 'url' && !buyUrl) {
      alert('Informe a URL de Venda.');
      return;
    }

    const categoryId = document.getElementById('product-category').value;
    const productName = document.getElementById('product-name').value.trim();
    const fileInput = document.getElementById('product-image-file');
    let imagePath = document.getElementById('product-image').value.trim();

    if (fileInput.files?.length) {
      try {
        imagePath = await uploadProductImage(categoryId, fileInput.files[0], productName);
      } catch (err) {
        alert(err.message || 'Falha ao enviar imagem.');
        return;
      }
    } else if (!imagePath) {
      alert('Selecione uma imagem JPG, PNG ou WEBP.');
      return;
    }

    const store = getStore();
    const data = {
      id: document.getElementById('product-id').value || String(Date.now()),
      name: productName,
      price: parseFloat(document.getElementById('product-price').value),
      categoryId,
      image: imagePath,
      shortDesc: document.getElementById('product-short').value.trim(),
      description: document.getElementById('product-desc').value.trim(),
      buyType,
      buyUrl: buyType === 'url' ? buyUrl : '',
      visible: document.getElementById('product-visible').checked
    };

    const idx = store.products.findIndex((p) => p.id === data.id);
    if (idx >= 0) store.products[idx] = data;
    else store.products.push(data);

    await persistStore(store);
    productModal.hide();
    renderProductsTable();
    renderCategoriesTable();
  }

  async function saveCategory(e) {
    e.preventDefault();
    const store = getStore();
    const label = document.getElementById('category-label').value.trim();
    const parent = document.getElementById('category-parent').value || null;
    const visible = document.getElementById('category-visible').checked;

    let id = editingCategoryId;
    if (!id) {
      const manualId = document.getElementById('category-id').value.trim();
      id = ensureUniqueCategoryId(store, manualId || slugifyCategoryId(label));
    }

    if (!label) return;

    if (editingCategoryId && parent) {
      const descendants = getCategoryDescendants(store, editingCategoryId);
      if (descendants.includes(parent)) {
        alert('A categoria pai não pode ser ela mesma nem uma subcategoria.');
        return;
      }
    }

    const data = { id, label, parent, visible };
    const idx = store.categories.findIndex((c) => c.id === editingCategoryId || c.id === id);

    if (idx >= 0) {
      data.order = store.categories[idx].order ?? 0;
      store.categories[idx] = data;
    } else {
      const siblings = getCategoryChildren(store, parent);
      data.order = siblings.reduce((max, c) => Math.max(max, c.order ?? 0), -1) + 1;
      store.categories.push(data);
    }

    await persistStore(store);
    categoryModal.hide();
    renderCategoriesTable();
    fillCategorySelect();
    renderProductsTable();
  }

  async function deleteProduct(id) {
    if (!confirm('Excluir este produto permanentemente?')) return;
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== id);
    await persistStore(store);
    renderProductsTable();
    renderCategoriesTable();
  }

  async function deleteCategory(id) {
    const store = getStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return;

    const children = getCategoryChildren(store, id);
    if (children.length) {
      alert('Esta categoria possui subcategorias. Exclua-as primeiro.');
      return;
    }

    const products = store.products.filter((p) => p.categoryId === id);
    let msg = `Excluir a categoria "${cat.label}"?`;
    if (products.length) {
      msg = `Esta categoria possui ${products.length} produto(s). Excluir categoria e produtos vinculados?`;
    }
    if (!confirm(msg)) return;

    store.categories = store.categories.filter((c) => c.id !== id);
    store.products = store.products.filter((p) => p.categoryId !== id);
    await persistStore(store);
    renderCategoriesTable();
    fillCategorySelect();
    renderProductsTable();
  }

  async function toggleProductVisibility(id, visible) {
    const store = getStore();
    const p = store.products.find((x) => x.id === id);
    if (p) {
      p.visible = visible;
      await persistStore(store);
      renderProductsTable();
    }
  }

  async function toggleCategoryVisibility(id, visible) {
    const store = getStore();
    const cat = store.categories.find((c) => c.id === id);
    if (!cat) return;
    cat.visible = visible;
    await persistStore(store);
    renderCategoriesTable();
    renderProductsTable();
  }

  document.getElementById('category-label').addEventListener('input', function () {
    if (editingCategoryId) return;
    const idField = document.getElementById('category-id');
    idField.value = slugifyCategoryId(this.value);
    document.getElementById('category-id-wrap').classList.toggle('d-none', !this.value.trim());
  });

  document.querySelectorAll('[data-panel]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchPanel(link.dataset.panel);
    });
  });

  document.getElementById('btn-new-product').addEventListener('click', () => openProductForm(null));
  document.getElementById('btn-new-category').addEventListener('click', () => openCategoryForm(null));
  document.getElementById('product-form').addEventListener('submit', saveProduct);
  document.getElementById('product-buy-type').addEventListener('change', toggleBuyUrlField);
  document.getElementById('product-category').addEventListener('change', updateProductImageHint);
  document.getElementById('product-image-file').addEventListener('change', function () {
    const file = this.files?.[0];
    if (file) {
      updateProductImagePreview(URL.createObjectURL(file));
      return;
    }
    updateProductImagePreview(document.getElementById('product-image').value);
  });
  document.getElementById('category-form').addEventListener('submit', saveCategory);

  initStore().then(() => {
    fillCategorySelect();
    renderProductsTable();
    renderCategoriesTable();
  });
})();
