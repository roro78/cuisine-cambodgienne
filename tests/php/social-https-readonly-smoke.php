<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/public/gestion-social/https-readonly.php';

$endpoint = 'https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly';
$base = [
    'social_readonly_https_endpoint' => $endpoint,
    'social_readonly_https_token' => str_repeat('A', 48),
];

function mustReject(array $cfg, string $status = 'draft', int $page = 1, ?string $id = null): void
{
    try {
        socialHttpsReadOnly($cfg, $status, $page, $id);
        throw new LogicException('Invalid request should have failed before network');
    } catch (RuntimeException $expected) {
        // Reject invalid input before cURL, and never fall back to anonymous REST.
    }
}

mustReject(array_replace($base, ['social_readonly_https_endpoint' => 'https://example.com/']));
mustReject(array_replace($base, ['social_readonly_https_endpoint' => $endpoint . '/../']));
mustReject(array_replace($base, ['social_readonly_https_token' => 'short']));
mustReject(array_replace($base, ['social_readonly_https_token' => "A\r\nInjected: true"]));
mustReject($base, 'unexpected');
mustReject($base, 'draft', 0);
mustReject($base, 'draft', 100001);
mustReject($base, 'draft', 1, '0');
mustReject($base, 'draft', 1, '9223372036854775808');
echo "social-https-readonly negative-input checks PASS\n";
