<?php
declare(strict_types=1);

require __DIR__ . '/../admin-monster/auth.php';
require __DIR__ . '/store-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const MAX_UPLOAD_BYTES = 5242880;

$allowedMime = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

if (!is_admin_logged_in()) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit;
}

$categoryId = trim((string) ($_POST['categoryId'] ?? ''));
$productName = trim((string) ($_POST['productName'] ?? ''));
$file = $_FILES['image'] ?? null;

if (!store_is_valid_id($categoryId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Categoria inválida']);
    exit;
}

if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhuma imagem enviada']);
    exit;
}

if (($file['size'] ?? 0) > MAX_UPLOAD_BYTES) {
    http_response_code(413);
    echo json_encode(['error' => 'Imagem muito grande (máx. 5 MB)']);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: '';
if (!isset($allowedMime[$mime])) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato inválido. Use JPG, PNG ou WEBP.']);
    exit;
}

try {
    $catalog = store_read_catalog();
} catch (RuntimeException) {
    http_response_code(500);
    echo json_encode(['error' => 'Catálogo indisponível']);
    exit;
}

$relativeDir = store_category_asset_path($catalog['categories'], $categoryId);
if ($relativeDir === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Categoria não encontrada']);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9\/_-]+$/', $relativeDir)) {
    http_response_code(400);
    echo json_encode(['error' => 'Caminho de categoria inválido']);
    exit;
}

$paths = store_catalog_paths();
$assetsRoot = realpath($paths['assets']);
if ($assetsRoot === false) {
    if (!is_dir($paths['assets']) && !mkdir($paths['assets'], 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Pasta assets indisponível']);
        exit;
    }
    $assetsRoot = realpath($paths['assets']);
}

if ($assetsRoot === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Pasta assets indisponível']);
    exit;
}

$targetDir = $assetsRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativeDir);
$targetParent = realpath(dirname($targetDir));

if ($targetParent === false) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Falha ao criar pasta de destino']);
        exit;
    }
} elseif (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao criar pasta de destino']);
    exit;
}

$targetDirReal = realpath($targetDir);
if ($targetDirReal === false || !str_starts_with($targetDirReal, $assetsRoot)) {
    http_response_code(400);
    echo json_encode(['error' => 'Destino inválido']);
    exit;
}

$baseName = strtolower($productName);
$baseName = strtr($baseName, [
    'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a',
    'é' => 'e', 'ê' => 'e',
    'í' => 'i',
    'ó' => 'o', 'ô' => 'o', 'õ' => 'o',
    'ú' => 'u', 'ü' => 'u',
    'ç' => 'c',
]);
$baseName = preg_replace('/[^a-z0-9]+/', '-', $baseName) ?? '';
$baseName = trim($baseName, '-') ?: 'produto';
$filename = $baseName . '-' . bin2hex(random_bytes(4)) . '.' . $allowedMime[$mime];
$destination = $targetDirReal . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao salvar imagem']);
    exit;
}

$publicPath = 'assets/' . $relativeDir . '/' . $filename;
echo json_encode(['path' => $publicPath]);
