<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function admin_config_path(): string
{
    return __DIR__ . '/config.php';
}

function admin_config_loaded(): bool
{
    return file_exists(admin_config_path());
}

function is_admin_logged_in(): bool
{
    if (empty($_SESSION['admin_authenticated'])) {
        return false;
    }

    $idleLimit = 3600;
    $lastActivity = (int) ($_SESSION['admin_last_activity'] ?? 0);

    if ($lastActivity > 0 && (time() - $lastActivity) > $idleLimit) {
        admin_logout();
        return false;
    }

    $_SESSION['admin_last_activity'] = time();

    return true;
}

function require_admin(): void
{
    if (!is_admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

function redirect_if_logged_in(): void
{
    if (is_admin_logged_in()) {
        header('Location: index.php');
        exit;
    }
}

function attempt_login(string $password): bool
{
    $now = time();
    $attempts = (int) ($_SESSION['login_attempts'] ?? 0);
    $lockout = (int) ($_SESSION['login_lockout'] ?? 0);

    if ($attempts >= 5 && ($now - $lockout) < 300) {
        return false;
    }

    if (($now - $lockout) >= 300) {
        $_SESSION['login_attempts'] = 0;
        unset($_SESSION['login_lockout']);
    }

    if (!admin_config_loaded()) {
        return false;
    }

    require admin_config_path();

    if (!defined('ADMIN_PASSWORD_HASH') || !ADMIN_PASSWORD_HASH) {
        return false;
    }

    $valid = password_verify($password, ADMIN_PASSWORD_HASH);

    if (!$valid) {
        $_SESSION['login_attempts'] = $attempts + 1;
        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['login_lockout'] = $now;
        }
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['admin_last_activity'] = time();
    unset($_SESSION['login_attempts'], $_SESSION['login_lockout']);

    return true;
}

function admin_logout(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

function login_error_message(): string
{
    $attempts = (int) ($_SESSION['login_attempts'] ?? 0);
    $lockout = (int) ($_SESSION['login_lockout'] ?? 0);
    $remaining = 300 - (time() - $lockout);

    if ($attempts >= 5 && $remaining > 0) {
        $minutes = (int) ceil($remaining / 60);
        return "Muitas tentativas. Aguarde {$minutes} min.";
    }

    return 'Senha incorreta.';
}
