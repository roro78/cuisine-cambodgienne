<?php
declare(strict_types=1);
/**
 * Cuisine du Cambodge — private social review, READ-ONLY first release.
 *
 * No n8n Wait bypass, no UPDATE/INSERT/DELETE, no Meta calls.
 * Secrets stay outside the web root. Only a separately provisioned SELECT-only
 * PostgreSQL account may be used for this screen.
 */
require_once __DIR__ . '/catalog-readonly.php';
require_once __DIR__ . '/n8n-wait-readonly.php';
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
/** Only pass through the signed form link from the existing validation email.
 * The link is never stored, re-issued, or used to submit a decision. */
function existingWaitUrl(mixed $value): ?string {
    if (!is_string($value) || strlen($value) > 1100 ||
        preg_match('/[\x00-\x20\x7f\\\\]/', $value)) return null;
    $p = parse_url($value);
    if (!is_array($p) || ($p['scheme'] ?? null) !== 'https'
        || ($p['host'] ?? null) !== 'n8n.orvekio.com'
        || isset($p['user']) || isset($p['pass']) || isset($p['port'])
        || isset($p['fragment'])) return null;
    if (!preg_match('~^/form-waiting/[A-Za-z0-9_-]{1,100}$~D', (string)($p['path'] ?? ''))) return null;
    if (!preg_match('/^signature=[A-Za-z0-9_.%-]{16,700}$/D', (string)($p['query'] ?? ''))) return null;
    return $value;
}

function rateLimit(string $secretDir, string $remote, bool $failed = false): bool {
    // Corrupt/unwritable throttle state is a security failure, NEVER reset it.
    // The path is deterministic, server-side and outside the web root.
    $path = $secretDir . '/social-login-' . hash('sha256', $remote) . '.json';
    if (is_link($path)) failClosed();
    $f = @fopen($path, 'c+');
    if ($f === false || !flock($f, LOCK_EX)) failClosed();
    $stat = fstat($f);
    if (!is_array($stat) || ($stat['size'] ?? 0) > 2048) failClosed();
    $raw = stream_get_contents($f);
    if ($raw === false) failClosed();
    try {
        $times = json_decode($raw === '' ? '[]' : $raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        failClosed();
    }
    if (!is_array($times) || !array_is_list($times) || count($times) > 5
        || count(array_filter($times, 'is_int')) !== count($times)) failClosed();
    $times = array_values(array_filter($times,
        static fn(int $t): bool => $t >= time() - 900 && $t <= time()));
    $blocked = count($times) >= 5;
    if (!$blocked && $failed) $times[] = time();
    $encoded = json_encode($times, JSON_THROW_ON_ERROR);
    if (!rewind($f) || !ftruncate($f, 0) ||
        fwrite($f, $encoded) !== strlen($encoded) || !fflush($f)) failClosed();
    if (!flock($f, LOCK_UN) || !fclose($f)) failClosed();
    if (!@chmod($path, 0600)) failClosed();
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
        exit('Session expirée : rechargez cette page.');
    } elseif ($authenticated && isset($_POST['open_existing_wait'])) {
        // No new approval path: HTTP 303 opens the original n8n Wait form.
        $resumeUrl = existingWaitUrl($_POST['wait_link'] ?? null);
        if ($resumeUrl === null) {
            http_response_code(422);
            exit('Lien de validation non conforme : utilisez le lien reçu par e-mail.');
        }
        header('Location: ' . $resumeUrl, true, 303);
        exit;
    } elseif ($authenticated && isset($_POST['open_wait_post'])) {
        // Resolve the existing signed URL only after reloading the draft
        // and checking n8n's matching waiting execution; no stored token.
        $requestedWaitPost = socialPostId($_POST['open_wait_post']);
        if ($requestedWaitPost === null) {
            http_response_code(422);
            exit('Identifiant de brouillon invalide.');
        }
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
$counts = [];
$catalogItems = null;
$catalogStatus = null;
$sourceKindFilter='all';
$sourceStateFilter='all';
$sourceQuery='';
$filteredCatalogItems=null;
$existingWaitLinks = [];
$existingWaitStatus = null;
$humanDecisionLabels = ['approved' => 'Approuvée', 'revision_requested' => 'Modification demandée', 'rejected' => 'Refusée'];
$sourceKindLabels = ['recette' => 'Recette', 'culture' => 'Carnet culturel',
    'atelier' => 'Atelier', 'ingredient' => 'Ingrédient', 'technique' => 'Technique'];
$postStatusLabels = ['draft' => 'À valider', 'approved' => 'Approuvée',
    'revision_requested' => 'Modification demandée', 'rejected' => 'Refusée',
    'publishing' => 'Publication en cours', 'published' => 'Publiée',
    'manual_review' => 'Vérification manuelle'];
$platformStateLabels = ['pending' => 'En attente', 'submitting' => 'Transmission en cours',
    'creating' => 'Préparation du média', 'checking' => 'Vérification Meta',
    'container_created' => 'Média préparé', 'published' => 'Publiée', 'manual_review' => 'Vérification manuelle'];
if ($authenticated) {
    // Use a separate SELECT-only role, never the n8n writer or Supabase service role.
    foreach (['social_readonly_dsn', 'social_readonly_user', 'social_readonly_password'] as $key)
        if (!isset($cfg[$key]) || !is_string($cfg[$key]) || $cfg[$key] === '') failClosed();
    if (!str_starts_with($cfg['social_readonly_dsn'], 'pgsql:')
        || !class_exists('PDO') || !in_array('pgsql', PDO::getAvailableDrivers(), true)) failClosed();
    // Reject duplicated parameters (e.g. sslmode=require;sslmode=disable),
    // embedded passwords, or libpq options that can override TLS protections.
    $dsnParts = explode(';', substr($cfg['social_readonly_dsn'], 6));
    $dsnValues = [];
    foreach ($dsnParts as $part) {
        if (!preg_match('/^(host|port|dbname|sslmode|sslrootcert)=([^;]+)$/iD', $part, $match)) failClosed();
        $key = strtolower($match[1]);
        if (array_key_exists($key, $dsnValues)) failClosed();
        $dsnValues[$key] = $match[2];
    }
    if (empty($dsnValues['host']) || empty($dsnValues['dbname']) ||
        !in_array($dsnValues['sslmode'] ?? '', ['require', 'verify-ca', 'verify-full'], true)) failClosed();
    // Never accept localhost, Unix sockets, IP literals or a lookalike host.
    // Only this Supabase project's direct endpoint or its regional pooler
    // may receive the dedicated read-only database credentials.
    // Supabase direct uses the bare PostgreSQL role; its IPv4 session
    // pooler requires role.PROJECT_REF. Transaction mode is forbidden
    // because this portal relies on prepared statements/session settings.
    $directPgHost = (bool)preg_match(
        '/^db[.]kljbnfjxwloiodwlbrrz[.]supabase[.]co$/D', $dsnValues['host']);
    $sessionPoolerHost = (bool)preg_match(
        '/^[a-z0-9-]+[.]pooler[.]supabase[.]com$/D', $dsnValues['host']);
    if ((!$directPgHost && !$sessionPoolerHost)
        || ($dsnValues['port'] ?? '5432') !== '5432'
        || $dsnValues['dbname'] !== 'postgres') failClosed();
    $expectedPgUser = $directPgHost ? 'cuisine_social_viewer'
        : 'cuisine_social_viewer.kljbnfjxwloiodwlbrrz';
    if ($cfg['social_readonly_user'] !== $expectedPgUser) failClosed();
    try {
        $pdo = new PDO(
            $cfg['social_readonly_dsn'], $cfg['social_readonly_user'], $cfg['social_readonly_password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
             PDO::ATTR_EMULATE_PREPARES => false,
             PDO::ATTR_TIMEOUT => 6]
        );
        // Only the dedicated, non-inheriting viewer role may read this dashboard.
        // Checking INSERT/UPDATE/DELETE on posts alone is insufficient: a
        // pre-existing PostgreSQL role may inherit privileges or bypass RLS.
        $truthy = static fn($v): bool => in_array($v, [true, 1, '1', 't', 'true'], true);
        $identity = $pdo->query(
            "SELECT current_user AS db_user, r.rolcanlogin, r.rolinherit, r.rolsuper,
                    r.rolbypassrls, r.rolcreatedb, r.rolcreaterole, r.rolreplication,
                    EXISTS(
                      SELECT 1 FROM pg_auth_members m
                      LEFT JOIN pg_roles member_role ON member_role.oid=m.member
                      WHERE m.member=r.oid
                         OR (m.roleid=r.oid AND NOT (
                             member_role.rolname='postgres'
                             AND m.admin_option=true
                             AND m.inherit_option=false
                             AND m.set_option=false
                         ))
                    ) AS has_memberships,
                    (SELECT c.relrowsecurity FROM pg_class c
                       JOIN pg_namespace n ON n.oid=c.relnamespace
                      WHERE n.nspname='cuisine_social' AND c.relname='posts') AS rls_enabled,
                    EXISTS(SELECT 1 FROM pg_policies
                            WHERE schemaname='cuisine_social' AND tablename='posts'
                              AND policyname='cuisine_social_viewer_read_posts'
                              AND cmd='SELECT' AND qual='true' AND with_check IS NULL
                              AND roles=ARRAY['cuisine_social_viewer']::name[]) AS viewer_policy
               FROM pg_roles r WHERE r.rolname=current_user"
        )->fetch();
        if (!$identity || ($identity['db_user'] ?? '') !== 'cuisine_social_viewer'
            || !$truthy($identity['rolcanlogin'] ?? false)
            || !$truthy($identity['rls_enabled'] ?? false)
            || !$truthy($identity['viewer_policy'] ?? false)) failClosed();
        foreach (['rolinherit','rolsuper','rolbypassrls','rolcreatedb','rolcreaterole',
                  'rolreplication','has_memberships'] as $danger)
            if ($truthy($identity[$danger] ?? false)) failClosed();
        $rights = $pdo->query(
            "SELECT has_table_privilege(current_user,'cuisine_social.posts','SELECT') AS can_read,
                    has_table_privilege(current_user,'cuisine_social.posts','INSERT') AS can_insert,
                    has_table_privilege(current_user,'cuisine_social.posts','UPDATE') AS can_update,
                    has_table_privilege(current_user,'cuisine_social.posts','DELETE') AS can_delete,
                    has_table_privilege(current_user,'cuisine_social.posts','TRUNCATE') AS can_truncate,
                    has_table_privilege(current_user,'cuisine_social.posts','REFERENCES') AS can_reference,
                    has_table_privilege(current_user,'cuisine_social.posts','TRIGGER') AS can_trigger,
                    has_table_privilege(current_user,'cuisine_social.validation_dispatches','SELECT') AS can_read_dispatch,
                    has_table_privilege(current_user,'cuisine_social.validation_dispatches','INSERT') AS can_insert_dispatch,
                    has_table_privilege(current_user,'cuisine_social.validation_dispatches','UPDATE') AS can_update_dispatch,
                    has_table_privilege(current_user,'cuisine_social.validation_dispatches','DELETE') AS can_delete_dispatch"
        )->fetch();
        if (!$truthy($rights['can_read'] ?? false)) failClosed();
        foreach (['can_insert','can_update','can_delete','can_truncate','can_reference','can_trigger',
                  'can_read_dispatch','can_insert_dispatch','can_update_dispatch','can_delete_dispatch'] as $danger)
            if ($truthy($rights[$danger] ?? false)) failClosed();
        $pdo->exec('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
        $status = (string)($_GET['status'] ?? 'draft');
        $allowed = ['all', 'draft', 'approved', 'revision_requested', 'rejected', 'publishing', 'published', 'manual_review', 'sources'];
        if (!in_array($status, $allowed, true)) $status = 'draft';
        $sql = 'SELECT id::text AS id,source_id,source_fingerprint,source_snapshot,scheduled_date::text AS scheduled_date,facebook_caption,instagram_caption,image_url,status,fb_state,ig_state,human_decision,human_note,decided_at::text AS decided_at,approved_at::text AS approved_at,published_at::text AS published_at,facebook_post_id,instagram_post_id,instagram_container_id FROM cuisine_social.posts';
        if ($status !== 'all' && $status !== 'sources') $sql .= ' WHERE status = :status';
        $candidate = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1, 'max_range' => 100000]]);
        $page = $candidate === false ? 1 : $candidate;
        $sql .= ' ORDER BY scheduled_date DESC,id DESC LIMIT 50 OFFSET :offset';
        $stmt = $pdo->prepare($sql);
        if ($status !== 'all' && $status !== 'sources') $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':offset', ($page - 1) * 50, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $status === 'sources' ? [] : $stmt->fetchAll();
        if (isset($requestedWaitPost)) {
            $query = $pdo->prepare('SELECT id::text AS id,source_id,source_fingerprint,
                scheduled_date::text AS scheduled_date,facebook_caption,instagram_caption,
                image_url,status,fb_state,ig_state,human_decision,decided_at,
                approved_at,published_at,facebook_post_id,instagram_post_id,
                instagram_container_id
                FROM cuisine_social.posts WHERE id=:id AND status=\'draft\' AND human_decision IS NULL');
            $query->bindValue(':id',$requestedWaitPost,PDO::PARAM_STR);
            $query->execute();
            $target=$query->fetch();
            if (!$target) {
                http_response_code(409);
                exit('Cette publication n’est plus en attente de décision.');
            }
            $links=socialExistingN8nWaitLinks($cfg,[$target]);
            $safe=$links[$requestedWaitPost]??null;
            if ($safe===null) {
                http_response_code(409);
                exit('Formulaire n8n non vérifié : utiliser le lien du courriel.');
            }
            header('Location: '.$safe,true,303);
            exit;
        }
        if ($status === 'draft' && $rows) {
            $existingWaitLinks = socialExistingN8nWaitLinks($cfg,$rows) ?? [];
            if (!$existingWaitLinks) $existingWaitStatus =
                'Lien direct non disponible : le formulaire reçu par e-mail reste utilisable.';
        }
        $counts = $pdo->query('SELECT status,count(*)::int AS total FROM cuisine_social.posts GROUP BY status')->fetchAll(PDO::FETCH_KEY_PAIR);
        if ($status === 'sources') {
            // Independent views: public static catalogue = editorial candidates;
            // PostgreSQL drafts = n8n-selected review tasks. Never queue a source here.
            $historyRows = $pdo->query(
                'SELECT DISTINCT ON (source_id) source_id,source_fingerprint,status
                 FROM cuisine_social.posts
                 ORDER BY source_id,scheduled_date DESC,id DESC LIMIT 1001'
            )->fetchAll();
            if (count($historyRows) > 1000) {
                $catalogStatus = 'Historique trop volumineux pour comparer les sources.';
            } else {
                $history = [];
                foreach ($historyRows as $record) $history[(string)$record['source_id']] = [
                    'fingerprint'=>(string)$record['source_fingerprint'],
                    'status'=>(string)$record['status']
                ];
                $liveFeed = readDeployedSocialFeed();
                if ($liveFeed === null) {
                    $catalogStatus = 'Catalogue du site indisponible. La file des brouillons reste consultable.';
                } else {
                    try {
                        $catalogItems = socialCatalogCandidates($liveFeed,$history);
                        // GET filters only change the displayed rows, never the feed or n8n queue.
                        $rawKind=$_GET['kind']??'all';
                        $rawState=$_GET['source_state']??'all';
                        $rawQuery=$_GET['q']??'';
                        $sourceKindFilter=is_string($rawKind)
                            && in_array($rawKind,['all','recette','culture','atelier','ingredient','technique'],true)
                            ? $rawKind : 'all';
                        $sourceStateFilter=is_string($rawState)
                            && in_array($rawState,['all','available','changed','missing_image','seen'],true)
                            ? $rawState : 'all';
                        $sourceQuery=is_string($rawQuery) && strlen($rawQuery)<=80
                            && !preg_match('/[\x00-\x1f\x7f]/',$rawQuery)
                            && preg_match('//u',$rawQuery) ? trim($rawQuery) : '';
                        $filteredCatalogItems=socialFilterCatalogCandidates(
                            $catalogItems,$sourceKindFilter,$sourceStateFilter,$sourceQuery);
                    } catch (UnexpectedValueException $e) {
                        $catalogStatus = 'Catalogue invalide. Aucune source non vérifiée n’est affichée.';
                    }
                }
            }
        }
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
.caption{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.55}
.review-history{border:1px solid #dce1da;border-radius:9px;background:#f8faf7;padding:11px 13px;margin:12px 0;font-size:13px;overflow-wrap:anywhere}
.source-card{display:flex;align-items:flex-start;gap:12px}
.source-photo{display:block;flex:0 0 88px;width:88px;height:88px;max-width:88px;object-fit:cover;border-radius:8px;background:#ebede7}
.source-photo-empty{display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;background:#ebe9e2;color:#56635c;font-size:11px;line-height:1.25}
.source-content{min-width:0;flex:1}
.source-content p{margin:8px 0 0}
.catalog-tools{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:16px 0}
.catalog-tools label{flex:1 1 175px;min-width:135px;font-size:13px;font-weight:600}
.catalog-tools input,.catalog-tools select{display:block;width:100%;font:inherit;font-weight:400;
margin:5px 0 0;padding:10px;background:#fff;border:1px solid #bac8be;border-radius:7px}
.catalog-tools button{padding:11px 17px}
.catalog-tools .reset-link{display:inline-block;padding:10px 4px}
.catalog-summary{margin-top:10px}
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
<section class="entry" aria-label="Reprendre une validation existante">
<h2>Accéder au formulaire de validation n8n</h2>
<p class="help">Collez le lien « Examiner et donner ma décision » de l'e-mail correspondant à la publication. Le formulaire existant vous propose <strong>Approuver</strong>, <strong>Demander une modification</strong> ou <strong>Refuser</strong>.</p>
<form method="post" autocomplete="off">
<input type="hidden" name="csrf" value="<?= h((string)$_SESSION['csrf']) ?>">
<label for="wait-link">Lien de validation reçu par e-mail</label>
<input id="wait-link" type="url" name="wait_link" required autocomplete="off"
    spellcheck="false" inputmode="url" placeholder="https://n8n.orvekio.com/form-waiting/…">
<button name="open_existing_wait" type="submit" value="1">Ouvrir le formulaire existant</button>
</form>
<p class="small">Ce lien n'est ni stocké ni envoyé à un autre service. La décision s'effectue dans n8n ; le dashboard ne publie rien.</p>
</section>
<p class="warning"><strong>Liste en consultation.</strong> L'e-mail reste la source du lien de validation. Les trois décisions sont enregistrées par le formulaire n8n existant, sans nouvelle logique SQL.</p>
<section class="review-history" aria-label="Origine des propositions éditoriales">
<strong>Comment une publication arrive ici</strong>
<p class="small">Les recettes, Carnets et ateliers intégrés au catalogue du site alimentent
<code>/social-feed.json</code> après déploiement. Le workflow n8n 01 parcourt ce catalogue
chaque jour à 7 h (heure de Paris), sélectionne au maximum un contenu doté
d'une image sociale compatible et enregistre un brouillon dans
<code>cuisine_social.posts</code>. Seuls ces brouillons sont affichés dans la file
« À valider » : créer une page ne déclenche pas immédiatement un e-mail.</p>
<p class="small" role="status"><strong>File actuelle :</strong>
<?= (int)($counts['draft'] ?? 0) ?> à valider ·
<?= (int)($counts['revision_requested'] ?? 0) ?> modification(s) demandée(s).
<a href="?status=sources">Voir les sources du catalogue</a>.
Les autres sujets du catalogue ne sont pas encore des propositions à valider.</p>
</section>
<?php if ($status === 'draft' && $existingWaitStatus !== null): ?>
<p class="small" role="status"><?= h($existingWaitStatus) ?></p>
<?php endif; ?>
<nav class="filters" aria-label="Filtrer les publications">
<?php foreach (['draft'=>'À valider','approved'=>'Approuvées','revision_requested'=>'À corriger','published'=>'Publiées','manual_review'=>'À examiner','rejected'=>'Refusées','all'=>'Toutes','sources'=>'Sources du site'] as $key=>$label): ?>
<a class="<?= ($status===$key?'selected':'') ?>" href="?status=<?= h($key) ?>"><?= h($label) ?> (<?= $key==='all' ? array_sum(array_map('intval',$counts)) : ($key==='sources' ? 'catalogue' : (int)($counts[$key] ?? 0)) ?>)</a>
<?php endforeach; ?>
</nav>
<p class="muted">La file de validation provient de PostgreSQL. Les sources du site
sont affichées séparément à partir du même flux public que lit n8n 01.
Aucune proposition sociale n'est créée depuis cette page.</p>
<?php if ($status === 'sources'): ?>
<section class="entry" aria-label="Sources éditoriales disponibles">
<h2>Sources du site, en attente de sélection éventuelle par n8n</h2>
<p class="small">Ce catalogue est celui du site <code>/social-feed.json</code>.
« Disponible » signifie qu'un contenu possède le visuel social nécessaire,
<strong>pas qu'un e-mail ou un brouillon a été créé</strong>. La sélection reste
pilotée par le workflow 01 au rythme actuel.</p>
<?php if ($catalogStatus !== null): ?>
<p class="warning" role="status"><?= h($catalogStatus) ?></p>
<?php elseif ($catalogItems !== null): ?>
<?php $sourceStates = array_count_values(array_column($catalogItems, 'state')); ?>
<p class="muted" role="status">
<strong><?= count($catalogItems) ?> sources au catalogue</strong> ·
<?= (int)($sourceStates['available'] ?? 0) ?> inédites avec image ·
<?= (int)($sourceStates['changed'] ?? 0) ?> modifiées ·
<?= (int)($sourceStates['missing_image'] ?? 0) ?> sans JPEG social ·
<?= (int)($sourceStates['seen'] ?? 0) ?> déjà proposées.
Ces chiffres proviennent du flux déployé et de l'historique PostgreSQL, pas du nombre de posts à valider.
</p>
<form method="get" class="catalog-tools" aria-label="Rechercher et filtrer les contenus">
<input type="hidden" name="status" value="sources">
<label>Type de contenu
<select name="kind">
<?php foreach (['all'=>'Tous les types','recette'=>'Recettes','culture'=>'Carnets',
 'atelier'=>'Ateliers','ingredient'=>'Ingrédients','technique'=>'Techniques'] as $value=>$label): ?>
<option value="<?= h($value) ?>"<?= $sourceKindFilter===$value?' selected':'' ?>><?= h($label) ?></option>
<?php endforeach; ?>
</select></label>
<label>État de la proposition sociale
<select name="source_state">
<?php foreach (['all'=>'Tous les états','available'=>'Jamais proposé, JPEG prêt',
 'changed'=>'Contenu modifié','missing_image'=>'JPEG social manquant',
 'seen'=>'Déjà proposé'] as $value=>$label): ?>
<option value="<?= h($value) ?>"<?= $sourceStateFilter===$value?' selected':'' ?>><?= h($label) ?></option>
<?php endforeach; ?>
</select></label>
<label>Rechercher un titre
<input type="search" name="q" maxlength="80" placeholder="Ex. Amok ou Kroeung"
 value="<?= h($sourceQuery) ?>">
</label>
<button type="submit">Filtrer</button>
<a class="reset-link" href="?status=sources">Tout afficher</a>
</form>
<p class="small catalog-summary" role="status"><strong><?= count($filteredCatalogItems ?? []) ?> contenu(s) affiché(s)</strong>
sur <?= count($catalogItems) ?> sources. Les filtres ne changent pas les programmations n8n.</p>
<?php if (!$catalogItems): ?><p class="empty">Aucune source dans le flux publié.</p><?php endif; ?>
<?php if ($catalogItems && !$filteredCatalogItems): ?>
<p class="empty">Aucun contenu ne correspond à ces filtres. <a href="?status=sources">Réinitialiser</a>.</p>
<?php endif; ?>
<?php foreach (($filteredCatalogItems ?? []) as $item): ?>
<div class="review-history source-card">
<?php if ($item['image_url'] !== null): ?>
<img class="source-photo" src="<?= h($item['image_url']) ?>"
     alt="Visuel social : <?= h($item['title']) ?>" width="88" height="88"
     loading="lazy" decoding="async">
<?php else: ?>
<div class="source-photo source-photo-empty" aria-label="Visuel social indisponible">JPEG social absent</div>
<?php endif; ?>
<div class="source-content">
<div class="badges">
<span class="badge"><?= h($sourceKindLabels[$item['kind']] ?? 'Autre') ?></span>
<span class="badge"><?php
echo h(match($item['state']) {
 'available'=>'Disponible pour n8n, non proposée',
 'changed'=>'Contenu modifié depuis la dernière proposition',
 'missing_image'=>'Image sociale JPEG requise',
 default=>'Déjà proposé au moins une fois'
}); ?></span>
</div>
<p><strong><?= h($item['title']) ?></strong> ·
<a href="<?= h($item['url']) ?>" target="_blank" rel="noopener noreferrer">Voir la page</a></p>
<?php if ($item['previous_status'] !== null): ?>
<p class="small">Dernier état connu : <?= h($postStatusLabels[$item['previous_status']] ?? $item['previous_status']) ?></p>
<?php endif; ?>
</div>
</div>
<?php endforeach; ?>
<?php endif; ?>
</section>
<?php else: ?>
<p class="muted">50 publications par page. États issus de PostgreSQL, sans vérification Meta indépendante.</p>
<?php $visibleTotal = $status === 'all' ? array_sum(array_map('intval', $counts)) : (int)($counts[$status] ?? 0); ?>
<nav class="filters" aria-label="Parcourir les publications">
<?php if ($page > 1): ?><a href="?status=<?= h($status) ?>&amp;page=<?= $page - 1 ?>">Page précédente</a><?php endif; ?>
<span class="muted">Page <?= $page ?> · <?= $visibleTotal ?> publication(s)</span>
<?php if ($page * 50 < $visibleTotal): ?><a href="?status=<?= h($status) ?>&amp;page=<?= $page + 1 ?>">Page suivante</a><?php endif; ?>
</nav>
<?php if (!$rows): ?><div class="empty"><?php if ($status === 'draft'): ?>
Aucun brouillon en attente de validation. Les nouvelles recettes, les Carnets et les ateliers
deviennent éligibles après mise en ligne du catalogue et le prochain passage du workflow 01,
sous réserve d'une image sociale compatible. Une source publiée sur le site n'est pas
nécessairement déjà transformée en post social.
<?php else: ?>Aucune publication dans cette catégorie.<?php endif; ?></div><?php endif; ?>
<?php foreach ($rows as $row):
    $snap = json_decode((string)$row['source_snapshot'], true);
    if (!is_array($snap)) $snap=[];
    $title = is_string($snap['title'] ?? null) ? (string)$snap['title'] : (string)$row['source_id'];
    $sourceKind = is_string($snap['kind'] ?? null) ? $snap['kind'] :
        explode(':', (string)$row['source_id'], 2)[0];
    $kindLabel = $sourceKindLabels[$sourceKind] ?? 'Autre contenu';
    $destination = pageUrl($snap['url'] ?? null);
    $image=photoUrl($row['image_url'] ?? null);
?>
<article class="entry">
<h2><?= h($title) ?></h2>
<div class="badges">
<span class="badge"><?= h($kindLabel) ?></span>
<span class="badge"><?= h($postStatusLabels[(string)$row['status']] ?? (string)$row['status']) ?></span>
<span class="badge">Facebook : <?= h($platformStateLabels[(string)$row['fb_state']] ?? (string)$row['fb_state']) ?></span>
<span class="badge">Instagram : <?= h($platformStateLabels[(string)$row['ig_state']] ?? (string)$row['ig_state']) ?></span>
<span class="badge">Prévu : <?= h((string)$row['scheduled_date']) ?></span>
</div>
<p class="small">Référence : <?= h((string)$row['source_id']) ?> · Brouillon n°<?= h((string)$row['id']) ?></p>
<?php if ($row['status'] === 'draft' && isset($existingWaitLinks[(string)$row['id']])): ?>
<form method="post" autocomplete="off">
<input type="hidden" name="csrf" value="<?= h((string)$_SESSION['csrf']) ?>">
<button type="submit" name="open_wait_post" value="<?= h((string)$row['id']) ?>">
Examiner et décider dans le formulaire n8n existant</button>
</form>
<p class="small">L'identifiant du brouillon est rapproché des données de
l'exécution Wait. Le formulaire s'ouvre sans approuver automatiquement.</p>
<?php endif; ?>
<?php if ($row['human_decision'] !== null): ?>
<section class="review-history" aria-label="Historique de la validation">
<strong>Décision humaine : <?= h($humanDecisionLabels[(string)$row['human_decision']] ?? (string)$row['human_decision']) ?></strong>
<?php if ($row['decided_at'] !== null): ?><span class="small"> · Enregistrée le <?= h((string)$row['decided_at']) ?></span><?php endif; ?>
<?php if (is_string($row['human_note']) && trim($row['human_note']) !== ''): ?><p class="caption"><?= h((string)$row['human_note']) ?></p><?php endif; ?>
</section>
<?php endif; ?>
<?php if ($row['facebook_post_id'] !== null || $row['instagram_post_id'] !== null): ?>
<p class="small">
<?php if ($row['facebook_post_id'] !== null): ?>Référence Facebook : <?= h((string)$row['facebook_post_id']) ?><?php endif; ?>
<?php if ($row['facebook_post_id'] !== null && $row['instagram_post_id'] !== null): ?> · <?php endif; ?>
<?php if ($row['instagram_post_id'] !== null): ?>Référence Instagram : <?= h((string)$row['instagram_post_id']) ?><?php endif; ?>
</p>
<?php endif; ?>
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
<?php endif; ?>
</main></body></html>
