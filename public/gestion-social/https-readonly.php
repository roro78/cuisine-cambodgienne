<?php
declare(strict_types=1);
/**
 * Opt-in HTTPS reader for the private Social Studio.
 * This file has no entry point, does not read credentials from the request,
 * and never authorizes a visitor. Caller MUST authenticate the Studio first.
 */
function socialHttpsReadOnly(array $cfg, string $status, int $page, ?string $draftId = null): array
{
    $url = $cfg['social_readonly_https_endpoint'] ?? null;
    $token = $cfg['social_readonly_https_token'] ?? null;
    $expected = 'https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly';
    $allowed = ['all','draft','approved','revision_requested','rejected',
                'publishing','published','manual_review','sources'];
    if (!is_string($url) || !hash_equals($expected, $url)
        || !is_string($token) || !preg_match('/^[A-Za-z0-9_-]{32,256}$/D', $token)
        || !in_array($status, $allowed, true) || $page < 1 || $page > 100000
        || !extension_loaded('curl')) {
        throw new RuntimeException('Private HTTPS reader configuration invalid');
    }
    if ($draftId !== null
        && (!preg_match('/^[1-9][0-9]{0,18}$/D', $draftId)
        || (strlen($draftId) === 19 && strcmp($draftId, '9223372036854775807') > 0))) {
        throw new RuntimeException('Invalid draft ID');
    }
    $params = ['status' => $status, 'page' => (string)$page];
    if ($draftId !== null) $params['draft_id'] = $draftId;
    $requestUrl = $expected . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $ch = curl_init($requestUrl);
    if ($ch === false) throw new RuntimeException('HTTPS reader unavailable');
    $buffer = '';
    try {
        curl_setopt_array($ch, [
            CURLOPT_HTTPGET => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'X-Cdc-Social-Read-Token: ' . $token,
            ],
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$buffer): int {
                if (strlen($buffer) + strlen($chunk) > 1600000) return 0;
                $buffer .= $chunk;
                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        if ($ok === false || $code !== 200
            || !preg_match('~^application/json(?:;|$)~i', $contentType)) {
            throw new RuntimeException('Private HTTPS reader unavailable');
        }
    } finally {
        curl_close($ch);
    }
    try {
        $result = json_decode($buffer, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new RuntimeException('Private HTTPS reader response invalid');
    }
    if (!is_array($result) || !array_is_list($result['rows'] ?? null)
        || !is_array($result['counts'] ?? null)
        || array_is_list($result['counts'])
        || !array_is_list($result['history'] ?? null)
        || !is_bool($result['history_overflow'] ?? null)
        || !array_key_exists('target', $result)
        || ($result['target'] !== null && !is_array($result['target']))) {
        throw new RuntimeException('Private HTTPS reader response invalid');
    }
    foreach ($result['rows'] as $row) {
        if (!is_array($row) || !is_string($row['id'] ?? null)
            || !is_string($row['status'] ?? null)) {
            throw new RuntimeException('Private HTTPS reader row invalid');
        }
    }
    foreach ($result['counts'] as $key => $value) {
        if (!in_array($key, $allowed, true) || !is_int($value) || $value < 0) {
            throw new RuntimeException('Private HTTPS reader counts invalid');
        }
    }
    return $result;
}
