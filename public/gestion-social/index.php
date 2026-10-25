<?php
declare(strict_types=1);
/**
 * Cuisine du Cambodge — private social review, READ-ONLY first release.
 *
 * No n8n Wait bypass, no UPDATE/INSERT/DELETE, no Meta calls.
 * Secrets stay outside the web root. Only a separately provisioned SELECT-only
 * PostgreSQL account may be used for this screen.
 */
ini_set('display_errors', '0');
header('Content-Type: text/html; charset=UTF-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store, private, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
$nonce = base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; style-src 'nonce-{$nonce}'; img-src https://www.cuisine-du-cambodge.com; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");

function failClosed(): never {
    http_response_code(503);
    exit('Espace privé non configuré ou indisponible.');
}
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function pageUrl(mixed $s): ?string {
    if (!is_string($s) || strlen($s) > 400) return null;
    $p = parse_url($s);
    if (!is_array($p) || ($p['scheme'] ?? '') !== 'https'
        || ($p['host'] ?? '') !== 'www.cuisine-du-cambodge.com'
        || isset($p['user']) || isset($p['pass']) || isset($p['port'])) return null;
    $path = $p['path'] ?? '';
    if (!preg_match('~^/(recettes|culture|apprendre|ingredients|techniques)/[a-z0-9/-]+/?$~D', $path)) return null;
    return 'https://www.cuisine-du-cambodge.com' . $path;
}
function photoUrl(mixed $s): ?string {
    if (!is_string($s) || strlen($s) > 300) return null;
    return preg_match('~^https://www[.]cuisine-du-cambodge[.]com/social-assets/[a-z0-9-]+[.]jpg$~D', $s) ? $s : null;
}
function rateLimit(string $secretDir, string $remote, bool $failed = false): bool {
    $path = $secretDir . '/social-login-' . hash('sha256', $remote) . '.json';
    $f = @fopen($path, 'c+');
    if ($f === false || !flock($f, LOCK_EX)) failClosed();
    $raw = stream_get_contents($f);
    $times = json_decode($raw ?: '[]', true);
    if (!is_array($times)) $times = [];
    $times = array_values(array_filter($times, static fn($t) => is_int($t) && $t >= time() - 900));
    $blocked = count($times) >= 5;
    if (!$blocked && $failed) $times[] = time();
    rewind($f);
    ftruncate($f, 0);
    fwrite($f, json_encode($times, JSON_THROW_ON_ERROR));
    fflush($f);
    flock($f, LOCK_UN);
    fclose($f);
    @chmod($path, 0600);
    return $blocked;
}

$https = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443');
if (!$https) { http_response_code(403); exit('HTTPS obligatoire.'); }
$secretDir = dirname(__DIR__, 3) . '/.cuisine-asset-portal';
$configFile = $secretDir . '/config.php';
if (!is_file($configFile)) failClosed();
$cfg = require $configFile;
if (!is_array($cfg) || !isset($cfg['admin_user'], $cfg['password_hash'])
    || !is_string($cfg['admin_user']) || !is_string($cfg['password_hash'])
    || !(str_starts_with($cfg['password_hash'], '$2') || str_starts_with($cfg['password_hash'], '$argon'))) failClosed();

session_name('CDC_SOCIAL_REVIEW');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_set_cookie_params([
    'lifetime' => 0, 'path' => '/gestion-social/',
    'secure' => true, 'httponly' => true, 'samesite' => 'Strict'
]);
session_start();
if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
if (isset($_SESSION['authenticated_at']) && time() - (int)$_SESSION['authenticated_at'] > 1800)
    unset($_SESSION['authenticated_at']);
$authenticated = isset($_SESSION['authenticated_at']);
$error = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals((string)$_SESSION['csrf'], $_POST['csrf'])) {
        http_response_code(403);
        $error = 'Session expirée : rechargez cette page.';
    } elseif (isset($_POST['logout'])) {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        $authenticated = false;
    } elseif (!$authenticated && isset($_POST['login'])) {
        if (!is_dir($secretDir) || !is_writable($secretDir)) failClosed();
        $remote = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $locked = rateLimit($secretDir, $remote);
        if ($locked) { http_response_code(429); $error = 'Trop de tentatives. Réessayez plus tard.'; }
        else {
            $user = (string)($_POST['username'] ?? '');
            $pwd = (string)($_POST['password'] ?? '');
            if (hash_equals($cfg['admin_user'], $user) && password_verify($pwd, $cfg['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['authenticated_at'] = time();
                $authenticated = true;
            } else {
                rateLimit($secretDir, $remote, true);
                $error = 'Identifiants incorrects.';
            }
        }
    }
}

$rows = [];
if ($authenticated) {
    // Use a separate SELECT-only role, never the n8n writer or Supabase service role.
    foreach (['social_readonly_dsn', 'social_readonly_user', 'social_readonly_password'] as $key)
        if (!isset($cfg[$key]) || !is_string($cfg[$key]) || $cfg[$key] === '') failClosed();
    if (!str_starts_with($cfg['social_readonly_dsn'], 'pgsql:')
        || !preg_match('/(?:^|;)sslmode=(?:require|verify-ca|verify-full)(?:;|$)/', $cfg['social_readonly_dsn'])
        || !class_exists('PDO') || !in_array('pgsql', PDO::getAvailableDrivers(), true)) failClosed();
    try {
        $pdo = new PDO(
            $cfg['social_readonly_dsn'], $cfg['social_readonly_user'], $cfg['social_readonly_password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
             PDO::ATTR_EMULATE_PREPARES => false,
             PDO::ATTR_TIMEOUT => 6]
        );
        // Refuse a configured writer/admin credential even if the supplied DSN works.
        $rights = $pdo->query("SELECT has_table_privilege(current_user,'cuisine_social.posts','SELECT') AS can_read, has_table_privilege(current_user,'cuisine_social.posts','INSERT') AS can_insert, has_table_privilege(current_user,'cuisine_social.posts','UPDATE') AS can_update, has_table_privilege(current_user,'cuisine_social.posts','DELETE') AS can_delete")->fetch();
        $truthy = static fn($v): bool => in_array($v, [true, 1, '1', 't', 'true'], true);
        if (!$truthy($rights['can_read'] ?? false)
            || $truthy($rights['can_insert'] ?? false)
            || $truthy($rights['can_update'] ?? false)
            || $truthy($rights['can_delete'] ?? false)) failClosed();
        $pdo->exec('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
        $status = (string)($_GET['status'] ?? 'draft');
        $allowed = ['all', 'draft', 'approved', 'revision_requested', 'rejected', 'publishing', 'published', 'manual_review'];
        if (!in_array($status, $allowed, true)) $status = 'draft';
        $sql = 'SELECT id::text AS id,source_id,source_snapshot,scheduled_date::text AS scheduled_date,facebook_caption,instagram_caption,image_url,status,fb_state,ig_state FROM cuisine_social.posts';
        if ($status !== 'all') $sql .= ' WHERE status = :status';
        $sql .= ' ORDER BY scheduled_date DESC,id DESC LIMIT 50';
        $stmt = $pdo->prepare($sql);
        if ($status !== 'all') $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->execute();
        $rows = $stmt->fetchAll();
    } catch (Throwable $e) {
        error_log('Cuisine social review: read-only database unavailable');
        failClosed();
    }
}
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Validation sociale — Cuisine du Cambodge</title>
<style nonce="<?= h($nonce) ?>">
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#243b32;background:#f8f6f1}
*{box-sizing:border-box}body{margin:0}main{max-width:1120px;margin:auto;padding:20px 16px 50px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px}
h1{font-family:Georgia,serif;font-size:clamp(25px,5vw,37px);margin:16px 0 8px}h2{font-size:17px;margin:0 0 12px}
p,.help{line-height:1.55}.muted{color:#586b61;font-size:13px}
a{color:#255b46}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #b97c25;outline-offset:2px}
button{cursor:pointer;border:0;border-radius:7px;padding:10px 15px;color:#fff;background:#285741;font-weight:700}
input{display:block;width:100%;padding:12px;margin:6px 0 14px;border:1px solid #bec6bd;border-radius:7px;font:inherit}
.login{max-width:390px;margin:40px auto;background:white;padding:24px;border:1px solid #e4e2dc;border-radius:12px}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.filters a{display:inline-block;text-decoration:none;border-radius:20px;border:1px solid #ccd2cb;padding:8px 12px;background:white;font-size:13px}
.filters a.selected{background:#285741;color:white}
.entry{background:white;border:1px solid #deded7;border-radius:13px;margin:18px 0;padding:18px;box-shadow:0 2px 12px #16271c0b}
.badges{display:flex;gap:8px;flex-wrap:wrap}.badge{font-size:12px;border-radius:25px;background:#e9efe7;padding:5px 11px}
.socials{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:12px 0}
.network{border:1px solid #dce1da;border-radius:12px;padding:15px;min-width:0}
.network strong{display:block;margin:0 0 12px}.network img{display:block;margin:0 auto 12px;width:min(100%,220px);height:auto;aspect-ratio:1;object-fit:contain;border-radius:8px}
.caption{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.55;max-height:240px;overflow:auto}
.small{font-size:12px;color:#526458}.warning{background:#fff5df;border-left:3px solid #bd892c;padding:13px}
.empty{padding:24px;background:white;border:1px dashed #bac8be;border-radius:12px}
@media(max-width:700px){.socials{grid-template-columns:1fr}.network{padding:12px}.network img{width:min(100%,190px)}}
</style>
</head><body><main>
<header><div><strong>Cuisine du Cambodge</strong><div class="muted">Espace éditorial privé</div></div>
<?php if ($authenticated): ?><form method="post"><input type="hidden" name="csrf" value="<?= h((string)$_SESSION['csrf']) ?>"><button name="logout" type="submit">Déconnexion</button></form><?php endif; ?>
</header>
<h1>Validation des publications</h1>
<?php if (!$authenticated): ?>
<section class="login"><h2>Connexion privée</h2>
<?php if ($error !== ''): ?><p role="alert"><?= h($error) ?></p><?php endif; ?>
<form method="post"><input type="hidden" name="csrf" value="<?= h((string)$_SESSION['csrf']) ?>">
<label>Identifiant <input name="username" autocomplete="username" required></label>
<label>Mot de passe <input type="password" name="password" autocomplete="current-password" required></label>
<button name="login" type="submit">Se connecter</button></form></section>
<?php else: ?>
<p class="warning"><strong>Consultation uniquement.</strong> Pour approuver, corriger ou refuser un post, utilisez pour l'instant le formulaire de validation reçu par e-mail. Cette page n'écrit jamais dans PostgreSQL et ne publie rien sur Meta.</p>
<nav class="filters" aria-label="Filtrer les publications">
<?php foreach (['draft'=>'À valider','approved'=>'Approuvées','revision_requested'=>'À corriger','published'=>'Publiées','manual_review'=>'À examiner','rejected'=>'Refusées','all'=>'Toutes'] as $key=>$label): ?>
<a class="<?= ($status===$key?'selected':'') ?>" href="?status=<?= h($key) ?>"><?= h($label) ?></a>
<?php endforeach; ?>
</nav>
<p class="muted">Maximum 50 publications par vue. État provenant de PostgreSQL ; vérification Meta indépendante.</p>
<?php if (!$rows): ?><div class="empty">Aucune publication dans cette catégorie.</div><?php endif; ?>
<?php foreach ($rows as $row):
    $snap = json_decode((string)$row['source_snapshot'], true);
    if (!is_array($snap)) $snap=[];
    $title = is_string($snap['title'] ?? null) ? (string)$snap['title'] : (string)$row['source_id'];
    $destination = pageUrl($snap['url'] ?? null);
    $image=photoUrl($row['image_url'] ?? null);
?>
<article class="entry">
<h2><?= h($title) ?></h2>
<div class="badges">
<span class="badge"><?= h((string)$row['status']) ?></span>
<span class="badge">Facebook : <?= h((string)$row['fb_state']) ?></span>
<span class="badge">Instagram : <?= h((string)$row['ig_state']) ?></span>
<span class="badge">Prévu : <?= h((string)$row['scheduled_date']) ?></span>
</div>
<p class="small">Référence : <?= h((string)$row['source_id']) ?> · Brouillon n°<?= h((string)$row['id']) ?></p>
<p><?php if ($destination): ?><a href="<?= h($destination) ?>" target="_blank" rel="noopener noreferrer">Consulter la page du site</a><?php else: ?>Destination à vérifier<?php endif; ?></p>
<div class="socials">
<?php foreach (['Facebook'=>'facebook_caption','Instagram'=>'instagram_caption'] as $platform=>$field): ?>
<div class="network"><strong><?= h($platform) ?> — aperçu</strong>
<?php if ($image): ?><img src="<?= h($image) ?>" alt="<?= h($title) ?>" width="220" height="220" loading="lazy"><?php else: ?><p class="warning">Image non conforme, validation bloquée.</p><?php endif; ?>
<div class="caption"><?= h((string)$row[$field]) ?></div></div>
<?php endforeach; ?>
</div>
<p class="small">Aperçus indicatifs, non captures officielles de Meta. L'image originale peut être recadrée dans l'application.</p>
</article>
<?php endforeach; ?>
<?php endif; ?>
</main></body></html>
