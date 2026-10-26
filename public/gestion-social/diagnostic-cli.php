<?php
declare(strict_types=1);
/**
 * Cuisine du Cambodge: CLI-only OVH deployment readiness check.
 * This file does not handle HTTP requests, passwords or role creation.
 * Prints only fixed status codes, never DSNs, database errors or secrets.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
ini_set('display_errors', '0');
function readinessFail(string $code): never {
    fwrite(STDOUT, "PORTAL_READINESS_FAIL: {$code}\n");
    exit(2);
}
function readinessOk(string $code): void {
    fwrite(STDOUT, "PORTAL_READINESS_PASS: {$code}\n");
}
function isTrue(mixed $v): bool {
    return in_array($v, [true,1,'1','t','true'], true);
}
if (PHP_VERSION_ID < 80100) readinessFail('PHP_VERSION');
readinessOk('PHP_VERSION');
if (!extension_loaded('pdo_pgsql')) readinessFail('PHP_PDO_PGSQL');
readinessOk('PHP_PDO_PGSQL');
if (!extension_loaded('curl')) readinessFail('PHP_CURL');
readinessOk('PHP_CURL');

$dir = dirname(__DIR__, 3) . '/.cuisine-asset-portal';
if (!is_dir($dir) || !is_file($dir.'/config.php')
    || is_link($dir) || is_link($dir.'/config.php')) readinessFail('PRIVATE_CONFIG_MISSING');
$config = require $dir.'/config.php';
if (!is_array($config)) readinessFail('PRIVATE_CONFIG_INVALID');
if (!is_string($config['admin_user'] ?? null) || ($config['admin_user'] ?? '')===''
    || !is_string($config['password_hash'] ?? null)
    || !(str_starts_with($config['password_hash'], '$2')
        || str_starts_with($config['password_hash'], '$argon')))
    readinessFail('ADMIN_LOGIN_CONFIG');
readinessOk('ADMIN_LOGIN_CONFIG');
if (($config['social_readonly_user'] ?? null) !== 'cuisine_social_viewer'
    || !is_string($config['social_readonly_password'] ?? null)
    || $config['social_readonly_password'] === ''
    || !is_string($config['social_readonly_dsn'] ?? null))
    readinessFail('VIEWER_CREDENTIALS_MISSING');

$dsn=$config['social_readonly_dsn'];
if (!str_starts_with($dsn,'pgsql:')) readinessFail('DSN');
$parts=explode(';',substr($dsn,6));
$values=[];
foreach($parts as $part) {
    if (!preg_match('/^(host|port|dbname|sslmode|sslrootcert)=([^;]+)$/iD',$part,$m))
        readinessFail('DSN');
    $key=strtolower($m[1]);
    if(isset($values[$key])) readinessFail('DSN_DUPLICATE');
    $values[$key]=$m[2];
}
if (!isset($values['host'],$values['dbname'],$values['sslmode'])
    || !in_array($values['sslmode'],['require','verify-ca','verify-full'],true))
    readinessFail('DSN_POLICY');
$directPgHost = (bool)preg_match(
    '/^db[.]kljbnfjxwloiodwlbrrz[.]supabase[.]co$/D', $values['host']);
$sessionPoolerHost = (bool)preg_match(
    '/^[a-z0-9-]+[.]pooler[.]supabase[.]com$/D', $values['host']);
if ((!$directPgHost && !$sessionPoolerHost)
    || ($values['port'] ?? '5432') !== '5432'
    || $values['dbname'] !== 'postgres')
    readinessFail('DSN_POLICY');
$expectedPgUser = $directPgHost ? 'cuisine_social_viewer'
    : 'cuisine_social_viewer.kljbnfjxwloiodwlbrrz';
if ($config['social_readonly_user'] !== $expectedPgUser)
    readinessFail('VIEWER_POOLER_USERNAME');
readinessOk('DSN_POLICY');

try {
    $db = new PDO($dsn, $config['social_readonly_user'], $config['social_readonly_password'],[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT=>6,
        PDO::ATTR_EMULATE_PREPARES=>false
    ]);
    // One read-only transaction; do not modify any production record.
    $db->beginTransaction();
    $db->exec('SET TRANSACTION READ ONLY');
    $id=$db->query(
        "SELECT current_user AS db_user, r.rolcanlogin,r.rolinherit,r.rolsuper,
             r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,r.rolreplication,
             EXISTS(
               SELECT 1 FROM pg_auth_members m
               LEFT JOIN pg_roles admin ON admin.oid=m.member
               WHERE m.member=r.oid OR
                 (m.roleid=r.oid AND NOT (
                    admin.rolname='postgres' AND m.admin_option=true
                    AND m.inherit_option=false AND m.set_option=false))
             ) AS forbidden_membership
          FROM pg_roles r WHERE r.rolname=current_user"
    )->fetch();
    if (!$id || $id['db_user']!=='cuisine_social_viewer' || !isTrue($id['rolcanlogin'])
        || isTrue($id['rolinherit']) || isTrue($id['rolsuper'])
        || isTrue($id['rolbypassrls']) || isTrue($id['rolcreatedb'])
        || isTrue($id['rolcreaterole']) || isTrue($id['rolreplication'])
        || isTrue($id['forbidden_membership'])) readinessFail('VIEWER_ROLE');
    readinessOk('VIEWER_ROLE');

    $access=$db->query(
        "SELECT has_schema_privilege(current_user,'cuisine_social','USAGE') AS schema_use,
            has_table_privilege(current_user,'cuisine_social.posts','SELECT') AS posts_read,
            has_table_privilege(current_user,'cuisine_social.posts','INSERT') AS posts_insert,
            has_table_privilege(current_user,'cuisine_social.posts','UPDATE') AS posts_update,
            has_table_privilege(current_user,'cuisine_social.posts','DELETE') AS posts_delete,
            has_table_privilege(current_user,'cuisine_social.posts','TRUNCATE') AS posts_truncate,
            has_table_privilege(current_user,'cuisine_social.posts','REFERENCES') AS posts_references,
            has_table_privilege(current_user,'cuisine_social.posts','TRIGGER') AS posts_trigger,
            has_table_privilege(current_user,'cuisine_social.validation_dispatches','SELECT') AS dispatch_read,
            has_table_privilege(current_user,'cuisine_social.validation_dispatches','INSERT') AS dispatch_insert,
            has_table_privilege(current_user,'cuisine_social.validation_dispatches','UPDATE') AS dispatch_update,
            has_table_privilege(current_user,'cuisine_social.validation_dispatches','DELETE') AS dispatch_delete"
    )->fetch();
    if (!$access || !isTrue($access['schema_use']) || !isTrue($access['posts_read']))
        readinessFail('VIEWER_READ_PERMISSION');
    foreach(['posts_insert','posts_update','posts_delete','posts_truncate',
             'posts_references','posts_trigger','dispatch_read','dispatch_insert',
             'dispatch_update','dispatch_delete'] as $danger)
        if (isTrue($access[$danger]??null)) readinessFail('VIEWER_WRITE_OR_DISPATCH_ACCESS');
    readinessOk('VIEWER_READ_ONLY');

    $rls=$db->query(
        "SELECT c.relrowsecurity AS rls_enabled, EXISTS (
           SELECT 1 FROM pg_policies
           WHERE schemaname='cuisine_social' AND tablename='posts'
           AND policyname='cuisine_social_viewer_read_posts'
           AND cmd='SELECT' AND qual='true' AND with_check IS NULL
           AND roles=ARRAY['cuisine_social_viewer']::name[]
        ) AS viewer_policy
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='cuisine_social' AND c.relname='posts'"
    )->fetch();
    if (!$rls || !isTrue($rls['rls_enabled']) || !isTrue($rls['viewer_policy']))
        readinessFail('POSTS_RLS');
    readinessOk('POSTS_RLS');

    $ssl=$db->query('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()')->fetch();
    if (!$ssl || !isTrue($ssl['ssl']??null)) readinessFail('POSTGRES_TLS');
    readinessOk('POSTGRES_TLS');
    $count=$db->query('SELECT COUNT(*)::int AS n FROM cuisine_social.posts')->fetch();
    if (!$count || !isset($count['n'])) readinessFail('POSTS_QUERY');
    readinessOk('POSTS_QUERY');
    $db->rollBack();
    readinessOk('READY_FOR_PRIVATE_ANDROID_TEST');
} catch (Throwable $e) {
    // PDO errors can contain connection parameters; never display them.
    readinessFail('POSTGRES_CONNECTION_OR_CHECK');
}
