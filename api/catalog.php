<?php
declare(strict_types=1);

require __DIR__ . '/../admin-monster/auth.php';
require __DIR__ . '/store-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const MAX_BODY_BYTES = 2097152;

$paths = store_catalog_paths();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    header('Cache-Control: public, max-age=60');
    echo json_encode(store_read_catalog_for_api($paths['catalog'], $paths['default']), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    if (!is_admin_logged_in()) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autorizado']);
        exit;
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') === false) {
        http_response_code(415);
        echo json_encode(['error' => 'Tipo de conteúdo inválido']);
        exit;
    }

    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > MAX_BODY_BYTES) {
        http_response_code(413);
        echo json_encode(['error' => 'Payload muito grande']);
        exit;
    }

    $input = json_decode($raw, true);
    if (!is_array($input) || !store_validate_catalog($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Dados inválidos']);
        exit;
    }

    if (!store_write_catalog($paths['catalog'], $input)) {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao salvar catálogo']);
        exit;
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
header('Allow: GET, POST');
echo json_encode(['error' => 'Método não permitido']);
