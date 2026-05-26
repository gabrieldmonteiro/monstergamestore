<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';
require_admin();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Monster — Monster Games Store</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="../css/style.css" rel="stylesheet">
</head>
<body>
  <nav class="navbar navbar-mgs site-header border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand navbar-logo" href="../index.html">
        <img src="../assets/logo.gif" alt="Monster GameStore">
      </a>
      <span class="text-muted small ms-2">Admin</span>
      <div class="ms-auto d-flex gap-2">
        <a href="../index.html" class="btn btn-outline-dark btn-sm">Ver loja</a>
        <a href="logout.php" class="btn btn-outline-danger btn-sm">Sair</a>
      </div>
    </div>
  </nav>

  <div class="container-fluid">
    <div class="row">
      <aside class="col-md-3 col-lg-2 admin-sidebar py-4 px-3">
        <nav class="nav flex-column gap-1">
          <a class="nav-link active" href="#" data-panel="products">Produtos</a>
          <a class="nav-link" href="#" data-panel="categories">Categorias</a>          
        </nav>
      </aside>

      <div class="col-md-9 col-lg-10 py-4 px-4">
        <section id="panel-products">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title mb-0">Produtos</h2>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#productModal" id="btn-new-product">+ Novo produto</button>
          </div>
          <div class="table-responsive">
            <table class="table table-hover admin-table align-middle">
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Visível</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="products-tbody"></tbody>
            </table>
          </div>
        </section>

        <section id="panel-categories" class="d-none">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="page-title mb-1">Categorias</h2>
              <p class="text-muted mb-0 small">Crie, edite, exclua e ordene categorias. A ordem vale entre categorias do mesmo nível.</p>
            </div>
            <button class="btn btn-primary" id="btn-new-category">+ Nova categoria</button>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th style="width:70px">Ordem</th>
                  <th>Nome / Caminho</th>
                  <th>ID</th>
                  <th>Pai</th>
                  <th>Produtos</th>
                  <th>Visível</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="categories-tbody"></tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>

  <div class="modal fade" id="productModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <form id="product-form">
          <div class="modal-header">
            <h5 class="modal-title" id="productModalTitle">Novo produto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="product-id">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label" for="product-name">Nome</label>
                <input type="text" class="form-control" id="product-name" required>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="product-price">Preço (R$)</label>
                <input type="number" class="form-control" id="product-price" step="0.01" min="0" required>
              </div>
              <div class="col-12">
                <label class="form-label" for="product-category">Categoria</label>
                <select class="form-select" id="product-category" required></select>
              </div>
              <div class="col-12">
                <label class="form-label" for="product-image-file">Imagem do produto</label>
                <input type="file" class="form-control" id="product-image-file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
                <input type="hidden" id="product-image">
                <div class="form-text" id="product-image-hint">Selecione a categoria para ver a pasta de destino.</div>
                <div id="product-image-preview" class="product-image-preview mt-2"></div>
              </div>
              <div class="col-12">
                <label class="form-label" for="product-short">Descrição curta</label>
                <input type="text" class="form-control" id="product-short" required>
              </div>
              <div class="col-12">
                <label class="form-label" for="product-desc">Descrição detalhada</label>
                <textarea class="form-control" id="product-desc" rows="4" required></textarea>
              </div>
              <div class="col-12">
                <label class="form-label" for="product-buy-type">Tipo de compra</label>
                <select class="form-select" id="product-buy-type">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <div class="col-12 d-none" id="product-buy-url-wrap">
                <label class="form-label" for="product-buy-url">URL de Venda</label>
                <input type="url" class="form-control" id="product-buy-url" placeholder="https://...">
              </div>
              <div class="col-12">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="product-visible" checked>
                  <label class="form-check-label" for="product-visible">Visível na loja</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal fade" id="categoryModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <form id="category-form">
          <div class="modal-header">
            <h5 class="modal-title" id="categoryModalTitle">Nova categoria</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label" for="category-label">Nome</label>
              <input type="text" class="form-control" id="category-label" required placeholder="Ex.: Novos, Usados, Playstation 4">
            </div>
            <div class="mb-3 d-none" id="category-id-wrap">
              <label class="form-label" for="category-id">ID (slug)</label>
              <input type="text" class="form-control" id="category-id" pattern="[a-z0-9-]+" placeholder="exemplo-categoria">
              <div class="form-text">Usado nas URLs. Apenas letras minúsculas, números e hífens.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="category-parent">Categoria pai</label>
              <select class="form-select" id="category-parent"></select>
            </div>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="category-visible" checked>
              <label class="form-check-label" for="category-visible">Visível na loja</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../js/storage.js"></script>
  <script src="../js/admin.js"></script>
</body>
</html>
