<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

redirect_if_logged_in();

$error = '';
$configMissing = !admin_config_loaded();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$configMissing) {
    $password = $_POST['password'] ?? '';

    if (attempt_login($password)) {
        header('Location: index.php');
        exit;
    }

    $error = login_error_message();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login — Admin Monster</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="../css/style.css" rel="stylesheet">
</head>
<body>
  <div class="admin-gate">
    <div class="admin-gate-card">
      <img src="../assets/logo.gif" alt="Monster GameStore" class="admin-gate-logo">
      <h1>Admin Monster</h1>

      <?php if ($configMissing): ?>
        <p class="text-muted">Arquivo <code>config.php</code> não encontrado.</p>
        <ol class="text-start small text-muted mb-0">
          <li>Copie <code>config.example.php</code> para <code>config.php</code></li>
          <li>Gere o hash: <code>php -r "echo password_hash('sua_senha', PASSWORD_DEFAULT);"</code></li>
          <li>Defina <code>ADMIN_PASSWORD_HASH</code> no <code>config.php</code></li>
        </ol>
      <?php else: ?>
        <p class="text-muted mb-4">Digite a senha para acessar o painel.</p>
        <form method="post" class="admin-login-form" autocomplete="off">
          <div class="mb-3">
            <label for="password" class="form-label">Senha</label>
            <input type="password" class="form-control" id="password" name="password" required autofocus>
          </div>
          <?php if ($error): ?>
            <div class="alert alert-danger py-2" role="alert"><?= htmlspecialchars($error) ?></div>
          <?php endif; ?>
          <button type="submit" class="btn btn-primary w-100">Entrar</button>
        </form>
      <?php endif; ?>

      <a href="../index.html" class="admin-gate-back">← Voltar à loja</a>
    </div>
  </div>
</body>
</html>
