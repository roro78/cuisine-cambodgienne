<?php
declare(strict_types=1);
/**
 * Private editorial image intake, on OVH shared PHP hosting.
 * GitHub inbox writes happen SERVER-SIDE, using a secret outside the web root.
 * NO credentials in HTML, JS, or the source repository.
 */
ini_set('display_errors', '0');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, private, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' blob: data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");

function e(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function respondUnavailable(): never {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Espace d'import non configuré. Contactez l'administrateur du site.";
    exit;
}
// Strict transport is required for login and uploads. No non-HTTPS fallback in production.
$https = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
if (!$https) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Connexion HTTPS obligatoire.');
}
// From ~/www/cdc2017/gestion-visuels/, go above ~/www to ~/.cuisine-asset-portal.
$secretDir = dirname(__DIR__, 3) . '/.cuisine-asset-portal';
$configFile = $secretDir . '/config.php';
if (!is_file($configFile)) respondUnavailable();
$config = require $configFile;
if (!is_array($config)
    || !isset($config['admin_user'], $config['password_hash'], $config['github_token'])
    || !is_string($config['admin_user']) || !is_string($config['password_hash']) || !is_string($config['github_token'])
    || strlen($config['github_token']) < 24 || !str_starts_with($config['password_hash'], '$2') && !str_starts_with($config['password_hash'], '$argon')) {
    respondUnavailable();
}
if (!function_exists('curl_init') || !function_exists('finfo_open')) respondUnavailable();

session_name('CDC_ASSET_SESSION');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_set_cookie_params(['lifetime' => 0, 'path' => '/gestion-visuels/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
if (isset($_SESSION['authenticated_at']) && time() - (int)$_SESSION['authenticated_at'] > 1800) {
    unset($_SESSION['authenticated_at']);
}
$authenticated = isset($_SESSION['authenticated_at']);
$messages = [];
$errors = [];

function attemptLock(string $path, string $action): bool {
    $f = @fopen($path, 'c+');
    if (!$f || !flock($f, LOCK_EX)) return true; // Fail closed if throttle cannot be read.
    $raw = stream_get_contents($f);
    $hits = json_decode($raw ?: '[]', true);
    if (!is_array($hits)) $hits = [];
    $hits = array_values(array_filter($hits, fn($t) => is_int($t) && $t > time() - 900));
    $locked = count($hits) >= 5;
    if ($action === 'failure' && !$locked) $hits[] = time();
    if ($action === 'success' && !$locked) $hits = [];
    rewind($f); ftruncate($f, 0); fwrite($f, json_encode($hits)); fflush($f);
    flock($f, LOCK_UN); fclose($f);
    @chmod($path, 0600);
    return $locked;
}
function pushToGithub(array $cfg, string $filePath, string $contents): void {
    $repo = 'roro78/cuisine-cambodgienne';
    $branch = 'assets/cuisine-inbox';
    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));
    $url = 'https://api.github.com/repos/' . $repo . '/contents/' . $encodedPath;
    $payload = json_encode([
        'message' => 'assets(inbox): receive ' . basename($filePath),
        'content' => base64_encode($contents),
        'branch' => $branch
    ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PUT', CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $cfg['github_token'],
            'Accept: application/vnd.github+json',
            'Content-Type: application/json',
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: CuisineDuCambodge-Asset-Inbox'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 65,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false || !in_array($http, [200, 201], true)) {
        // Never expose token or raw GitHub error payload in the browser.
        error_log('CDC asset intake GitHub error HTTP ' . $http . ' (' . substr($err, 0, 80) . ')');
        throw new RuntimeException('Envoi GitHub indisponible (HTTP ' . $http . ').');
    }
}
function sanitizeSlug(string $raw): string {
    $slug = strtolower(trim($raw));
    if (!preg_match('/^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/D', $slug)) throw new RuntimeException('Identifiant de page incorrect (lettres minuscules, chiffres, tirets).');
    return $slug;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals((string)$_SESSION['csrf'], $_POST['csrf'])) {
        http_response_code(403);
        $errors[] = 'Session expirée. Rechargez la page.';
    } elseif (isset($_POST['logout'])) {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $authenticated = false;
    } elseif (!$authenticated && isset($_POST['login'])) {
        if (!is_dir($secretDir) || !is_writable($secretDir)) respondUnavailable();
        $remote = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $rateFile = $secretDir . '/rate-' . hash('sha256', $remote) . '.json';
        $isLocked = attemptLock($rateFile, 'check');
        if ($isLocked) {
            http_response_code(429); $errors[] = 'Trop de tentatives. Revenez dans quinze minutes.';
        } elseif (hash_equals($config['admin_user'], (string)($_POST['username'] ?? '')) && password_verify((string)($_POST['password'] ?? ''), $config['password_hash'])) {
            attemptLock($rateFile, 'success');
            session_regenerate_id(true);
            $_SESSION['authenticated_at'] = time();
            $_SESSION['csrf'] = bin2hex(random_bytes(24));
            $authenticated = true;
        } else {
            attemptLock($rateFile, 'failure');
            $errors[] = 'Identifiants incorrects.';
        }
    } elseif ($authenticated && isset($_POST['upload'])) {
        $_SESSION['authenticated_at'] = time();
        try {
            $kind = (string)($_POST['kind'] ?? '');
            if (!in_array($kind, ['atelier', 'recette', 'accueil', 'autre'], true)) throw new RuntimeException('Type de page invalide.');
            $slug = sanitizeSlug((string)($_POST['slug'] ?? ''));
            $section = (string)($_POST['section'] ?? '');
            if (!in_array($section, ['etape', 'hero', 'detail', 'banniere', 'autre'], true)) throw new RuntimeException('Section invalide.');
            $step = filter_var($_POST['step'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 90]]);
            $version = filter_var($_POST['version'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 99]]);
            if ($step === false || $version === false) throw new RuntimeException('Étape ou version invalide.');
            $note = trim((string)($_POST['note'] ?? ''));
            if (strlen($note) > 1500) throw new RuntimeException('Les indications sont trop longues.');
            if (!isset($_FILES['photos']) || !is_array($_FILES['photos']['name'])) throw new RuntimeException('Sélectionnez au moins une image.');
            $files = $_FILES['photos'];
            $count = count($files['name']);
            if ($count < 1 || $count > 10) throw new RuntimeException('Limite : dix photos par envoi.');
            if (count($files['tmp_name']) !== $count || count($files['error']) !== $count || count($files['size']) !== $count) throw new RuntimeException('Fichiers incomplets.');
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $types = ['image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
            $prepared = [];
            $totalSize = 0;
            for ($i = 0; $i < $count; $i++) {
                if ($files['error'][$i] !== UPLOAD_ERR_OK || !is_uploaded_file($files['tmp_name'][$i])) throw new RuntimeException('Fichier impossible à recevoir.');
                $size = (int)$files['size'][$i];
                $totalSize += $size;
                if ($size < 100 || $size > 8 * 1024 * 1024 || $totalSize > 32 * 1024 * 1024) throw new RuntimeException('Fichier trop volumineux. Maximum : 8 Mo par image et 32 Mo par lot.');
                $mime = $finfo->file($files['tmp_name'][$i]);
                if (!isset($types[$mime])) throw new RuntimeException('Format non accepté. Utilisez WebP, PNG ou JPEG.');
                $imageSize = @getimagesize($files['tmp_name'][$i]);
                if (!is_array($imageSize) || ($imageSize['mime'] ?? '') !== $mime) throw new RuntimeException('Image endommagée ou format incohérent.');
                [$width, $height] = $imageSize;
                if ($width < 200 || $height < 200 || $width > 7000 || $height > 7000 || $width * $height > 30000000) throw new RuntimeException('Dimensions non acceptées.');
                $stepNumber = $step + $i;
                if ($stepNumber > 99) throw new RuntimeException('Numéro d’étape trop élevé pour ce lot.');
                $placement = $section === 'etape' ? 'etape-' . str_pad((string)$stepNumber, 2, '0', STR_PAD_LEFT) : $section;
                $filename = $kind . '__' . $slug . '__' . $placement . '__v' . str_pad((string)$version, 2, '0', STR_PAD_LEFT) . '.' . $types[$mime];
                $prepared[] = ['tmp' => $files['tmp_name'][$i], 'size' => $size, 'mime' => $mime, 'width' => $width, 'height' => $height, 'filename' => $filename, 'step' => $stepNumber];
            }
            foreach ($prepared as $one) {
                $uuid = gmdate('Ymd\THis\Z') . '-' . bin2hex(random_bytes(8));
                $folder = 'asset-inbox/' . $uuid;
                $bytes = file_get_contents($one['tmp']);
                if ($bytes === false) throw new RuntimeException('Lecture image impossible.');
                $sha = hash('sha256', $bytes);
                $manifest = [
                    'schema_version' => 1, 'asset_id' => $uuid, 'created_at_utc' => gmdate('c'),
                    'status' => 'a_integrer', 'project' => 'cuisine-du-cambodge',
                    'type' => $kind, 'page_slug' => $slug, 'section' => $section, 'step' => $one['step'],
                    'version' => $version, 'canonical_name' => $one['filename'],
                    'asset_path' => $folder . '/' . $one['filename'],
                    'sha256' => $sha, 'mime_type' => $one['mime'], 'bytes' => $one['size'],
                    'width' => $one['width'], 'height' => $one['height'], 'editorial_note' => $note
                ];
                // Store metadata first: the agent can always identify the intended placement, even on an image upload failure.
                pushToGithub($config, $folder . '/manifest.json', json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
                pushToGithub($config, $folder . '/' . $one['filename'], $bytes);
                $messages[] = 'Reçu : ' . $one['filename'] . ' — dossier ' . $uuid;
            }
        } catch (Throwable $exc) {
            error_log('CDC asset intake: ' . get_class($exc) . ' ' . substr($exc->getMessage(), 0, 150));
            $errors[] = 'Import interrompu : ' . $exc->getMessage() . ' Les images déjà confirmées restent dans la boîte de réception.';
        }
    }
}
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gestion privée des visuels — Cuisine du Cambodge</title>
  <meta name="robots" content="noindex,nofollow,noarchive">
  <link rel="stylesheet" href="/gestion-visuels/gestion.css">
</head>
<body>
  <main class="shell">
    <header class="top"><span class="monogram">C<span>D</span>C</span><span class="admin-label">ESPACE PRIVÉ · CUISINE DU CAMBODGE</span></header>
    <?php if (!$authenticated): ?>
      <section class="panel login-panel">
        <p class="eyebrow">Accès réservé</p><h1>Gestion des visuels</h1>
        <p class="lead">Connectez-vous pour déposer vos images. Aucun fichier n’est accessible depuis cette interface sans authentification.</p>
        <?php foreach ($errors as $error): ?><p class="notice error" role="alert"><?= e($error) ?></p><?php endforeach; ?>
        <form method="post" class="fields" autocomplete="on">
          <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
          <input type="hidden" name="login" value="1">
          <label>Identifiant<input name="username" autocomplete="username" required maxlength="80"></label>
          <label>Mot de passe<input type="password" name="password" autocomplete="current-password" required></label>
          <button type="submit" class="primary">Accéder aux visuels <span aria-hidden="true">→</span></button>
        </form>
      </section>
    <?php else: ?>
      <div class="toolbar"><p class="eyebrow">Votre bibliothèque de production</p><form method="post"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><button class="signout" name="logout" value="1" type="submit">Déconnexion</button></form></div>
      <h1>Importer des images</h1><p class="lead">Ajoutez vos photos générées par IA. Chaque image est identifiée avec son emplacement exact avant d’être reprise dans le site.</p>
      <?php foreach ($messages as $message): ?><p class="notice success" role="status"><?= e($message) ?></p><?php endforeach; ?>
      <?php foreach ($errors as $error): ?><p class="notice error" role="alert"><?= e($error) ?></p><?php endforeach; ?>
      <form method="post" enctype="multipart/form-data" class="panel upload-panel" id="upload-form">
        <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
        <input type="hidden" name="upload" value="1">
        <div class="grid">
          <label>Destination de l’image<select name="kind" id="asset-kind" required><option value="atelier">Atelier culinaire</option><option value="recette">Fiche recette</option><option value="accueil">Page d’accueil</option><option value="autre">Autre page</option></select></label>
          <label>Identifiant de la page<input name="slug" id="asset-slug" value="piler-aromates-au-mortier" pattern="[a-z0-9-]+" maxlength="82" required spellcheck="false" aria-describedby="slug-help"><small id="slug-help">Par exemple : piler-aromates-au-mortier</small></label>
          <label>Emplacement<select name="section" id="asset-section"><option value="etape">Étapes numérotées</option><option value="hero">Grande photo d’ouverture</option><option value="detail">Illustration de détail</option><option value="banniere">Bannière</option><option value="autre">Autre section</option></select></label>
          <label>Numéro de première étape<input type="number" min="1" max="90" value="1" name="step" id="asset-step" required></label>
          <label>Version<input type="number" min="1" max="99" value="1" name="version" id="asset-version" required></label>
        </div>
        <label>Indications éditoriales (facultatif)<textarea name="note" rows="3" maxlength="450" placeholder="Ex. : même mortier et même lumière que l’étape précédente, montrer la pâte plus fine."></textarea></label>
        <label class="dropzone" for="asset-photos" id="dropzone"><span class="drop-icon" aria-hidden="true">＋</span><strong>Déposer les images ici</strong><span>ou appuyer pour choisir les fichiers</span><small>WebP · PNG · JPG — 10 photos maximum — 8 Mo par image</small>
          <input type="file" name="photos[]" id="asset-photos" accept="image/webp,image/png,image/jpeg,.webp,.png,.jpg,.jpeg" multiple required>
        </label>
        <div id="file-preview" class="preview" aria-live="polite"></div>
        <p class="hint"><strong>Nommage automatique :</strong> <code id="name-preview">atelier__piler-aromates-au-mortier__etape-01__v01.webp</code></p>
        <button type="submit" class="primary" id="submit-upload">Envoyer les visuels <span aria-hidden="true">↑</span></button>
        <p class="privacy">Les fichiers sont déposés dans la boîte de réception GitHub du projet, hors des pages publiques du site. Ils ne sont pas publiés automatiquement.</p>
      </form>
    <?php endif; ?>
    <footer>Gestion éditoriale privée · Cuisine du Cambodge</footer>
  </main>
  <?php if ($authenticated): ?><script src="/gestion-visuels/gestion.js" defer></script><?php endif; ?>
</body>
</html>