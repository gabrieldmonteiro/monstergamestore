<?php
declare(strict_types=1);

const STORE_CATALOG_VERSION = 3;

function store_catalog_paths(): array
{
    $root = dirname(__DIR__);

    return [
        'catalog' => $root . '/data/catalog.json',
        'default' => $root . '/data/catalog.default.json',
        'assets' => $root . '/assets',
    ];
}

function store_read_json_file(string $path): ?array
{
    if (!is_readable($path)) {
        return null;
    }

    $raw = file_get_contents($path);
    if ($raw === false) {
        return null;
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : null;
}

function store_read_catalog(): array
{
    $paths = store_catalog_paths();
    $data = store_read_json_file($paths['catalog']);

    if ($data !== null) {
        return $data;
    }

    $defaults = store_read_json_file($paths['default']);
    if ($defaults === null) {
        throw new RuntimeException('Catálogo indisponível');
    }

    return $defaults;
}

function store_category_chain(array $categories, string $categoryId): ?array
{
    $map = [];
    foreach ($categories as $cat) {
        if (isset($cat['id'])) {
            $map[(string) $cat['id']] = $cat;
        }
    }

    if (!isset($map[$categoryId])) {
        return null;
    }

    $chain = [];
    $current = $map[$categoryId];

    while ($current) {
        array_unshift($chain, $current);
        $parentId = $current['parent'] ?? null;
        $current = $parentId ? ($map[(string) $parentId] ?? null) : null;
    }

    if (count($chain) > 1 && ($chain[0]['parent'] ?? null) === null) {
        array_shift($chain);
    }

    return $chain;
}

function store_category_asset_segment(array $cat): string
{
    $label = trim((string) ($cat['label'] ?? ''));
    $id = (string) ($cat['id'] ?? '');

    if ($id === 'ps4' || preg_match('/playstation\s*4|^ps4$/i', $label)) {
        return 'PS4';
    }

    if ($id === 'ps5' || preg_match('/playstation\s*5|^ps5$/i', $label)) {
        return 'PS5';
    }

    $normalized = strtolower($label);
    $normalized = strtr($normalized, [
        'á' => 'a', 'à' => 'a', 'ã' => 'a', 'â' => 'a',
        'é' => 'e', 'ê' => 'e',
        'í' => 'i',
        'ó' => 'o', 'ô' => 'o', 'õ' => 'o',
        'ú' => 'u', 'ü' => 'u',
        'ç' => 'c',
    ]);
    $normalized = preg_replace('/[^a-z0-9]+/', '', $normalized) ?? '';

    return $normalized !== '' ? $normalized : 'outros';
}

function store_category_asset_path(array $categories, string $categoryId): ?string
{
    $chain = store_category_chain($categories, $categoryId);
    if (!$chain) {
        return null;
    }

    $segments = array_map('store_category_asset_segment', $chain);
    $segments = array_values(array_filter($segments, static fn ($s) => $s !== ''));

    return $segments ? implode('/', $segments) : null;
}

function store_is_valid_id(string $id): bool
{
    return (bool) preg_match('/^[a-z0-9-]{1,64}$/', $id);
}

function store_is_valid_image(string $url): bool
{
    if (str_starts_with($url, 'assets/')) {
        return (bool) preg_match('/^assets\/[a-zA-Z0-9\/_.-]+$/', $url);
    }

    return (bool) filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https?:\/\//i', $url);
}

function store_is_valid_buy_url(string $url): bool
{
    return (bool) filter_var($url, FILTER_VALIDATE_URL) && preg_match('/^https?:\/\//i', $url);
}

function store_is_valid_text(string $value, int $max): bool
{
    return mb_strlen($value) <= $max;
}

function store_validate_catalog(array $data): bool
{
    if (!isset($data['categories'], $data['products'])) {
        return false;
    }

    if (!is_array($data['categories']) || !is_array($data['products'])) {
        return false;
    }

    if (count($data['categories']) > 100 || count($data['products']) > 500) {
        return false;
    }

    $categoryIds = [];

    foreach ($data['categories'] as $cat) {
        if (!is_array($cat) || !isset($cat['id'], $cat['label'])) {
            return false;
        }

        if (!store_is_valid_id((string) $cat['id']) || !store_is_valid_text((string) $cat['label'], 120)) {
            return false;
        }

        if (isset($cat['parent']) && $cat['parent'] !== null && !store_is_valid_id((string) $cat['parent'])) {
            return false;
        }

        $categoryIds[(string) $cat['id']] = true;
    }

    foreach ($data['categories'] as $cat) {
        if (!empty($cat['parent']) && !isset($categoryIds[(string) $cat['parent']])) {
            return false;
        }
    }

    foreach ($data['products'] as $product) {
        if (!is_array($product) || !isset($product['id'], $product['name'], $product['categoryId'])) {
            return false;
        }

        if (
            !store_is_valid_id((string) $product['id'])
            || !isset($categoryIds[(string) $product['categoryId']])
            || !store_is_valid_text((string) $product['name'], 200)
        ) {
            return false;
        }

        if (!isset($product['price']) || !is_numeric($product['price']) || $product['price'] < 0 || $product['price'] > 999999) {
            return false;
        }

        if (!isset($product['image']) || !store_is_valid_image((string) $product['image'])) {
            return false;
        }

        $buyType = $product['buyType'] ?? 'whatsapp';
        if (!in_array($buyType, ['whatsapp', 'url'], true)) {
            return false;
        }

        if ($buyType === 'url' && (empty($product['buyUrl']) || !store_is_valid_buy_url((string) $product['buyUrl']))) {
            return false;
        }

        foreach (['shortDesc', 'description'] as $field) {
            if (isset($product[$field]) && !store_is_valid_text((string) $product[$field], 5000)) {
                return false;
            }
        }
    }

    return true;
}

function store_write_catalog(string $catalogPath, array $data): bool
{
    $data['catalogVersion'] = STORE_CATALOG_VERSION;
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if ($json === false) {
        return false;
    }

    $dir = dirname($catalogPath);
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        return false;
    }

    $tmp = $catalogPath . '.tmp';
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }

    return rename($tmp, $catalogPath);
}

function store_read_catalog_for_api(string $catalogPath, string $defaultPath): array
{
    $data = store_read_json_file($catalogPath);
    if ($data !== null) {
        return $data;
    }

    $defaults = store_read_json_file($defaultPath);
    if ($defaults === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Catálogo indisponível']);
        exit;
    }

    if (!is_dir(dirname($catalogPath))) {
        mkdir(dirname($catalogPath), 0755, true);
    }

    store_write_catalog($catalogPath, $defaults);

    return $defaults;
}
