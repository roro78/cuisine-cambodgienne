<?php
declare(strict_types=1);
/** Run from the OVH CLI only; never as a public HTTP endpoint. */
if (PHP_SAPI !== 'cli') exit("Terminal requis.\n");
$home = getenv('HOME');
if (!$home || !is_dir($home)) exit("Dossier HOME introuvable.\n");
$dir = rtrim($home, '/') . '/.cuisine-asset-portal';
$file = $dir . '/config.php';
if (is_file($file)) exit("Configuration déjà présente. Aucun écrasement automatique.\n");
if (!is_dir($dir) && !mkdir($dir, 0700)) exit("Impossible de créer le dossier privé.\n");
chmod($dir, 0700);
function secretPrompt(string $label): string {
    $saved = trim((string)shell_exec('stty -g 2>/dev/null'));
    if ($saved === '') exit("Terminal sécurisé requis pour saisir les secrets.\n");
    fwrite(STDOUT, $label);
    shell_exec('stty -echo');
    try { $value = trim((string)fgets(STDIN)); }
    finally { shell_exec('stty ' . escapeshellarg($saved)); fwrite(STDOUT, "\n"); }
    return $value;
}
$admin = trim((string)readline('Identifiant admin [admin] : ')) ?: 'admin';
if (!preg_match('/^[a-zA-Z0-9_-]{3,30}$/D', $admin)) exit("Identifiant invalide.\n");
$pass = secretPrompt('Mot de passe fort (16 caractères minimum) : ');
$confirm = secretPrompt('Confirmer le mot de passe : ');
if (strlen($pass) < 16 || !hash_equals($pass, $confirm)) exit("Mot de passe trop court ou différent.\n");
$token = secretPrompt('Jeton GitHub fine-grained (Contents Read/Write, dépôt cuisine-cambodgienne seul) : ');
if (strlen($token) < 24 || !preg_match('/^(github_pat_|ghp_|ghu_)/', $token)) exit("Jeton GitHub non reconnu.\n");
$config = ['admin_user' => $admin, 'password_hash' => password_hash($pass, PASSWORD_DEFAULT), 'github_token' => $token];
unset($pass, $confirm, $token);
$payload = "<?php\n// Fichier privé : ne jamais transférer dans ~/www ou GitHub.\nreturn " . var_export($config, true) . ";\n";
$tmp = $file . '.tmp-' . bin2hex(random_bytes(5));
if (file_put_contents($tmp, $payload, LOCK_EX) === false) exit("Impossible d'écrire le fichier de configuration.\n");
chmod($tmp, 0600);
if (!rename($tmp, $file)) exit("Impossible de finaliser la configuration.\n");
echo "Configuration privée créée dans HOME/.cuisine-asset-portal/config.php (droits 0600).\n";