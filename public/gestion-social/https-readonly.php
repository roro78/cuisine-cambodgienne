<?php
declare(strict_types=1);
/** Private server-to-server reader. The caller must authenticate its visitor first. */
function socialHttpsReadOnly(array $cfg, string $status, int $page, ?string $draftId = null, ?callable $transport = null): array
{
    $expected = 'https://kljbnfjxwloiodwlbrrz.supabase.co/functions/v1/cuisine-social-readonly';
    $token = $cfg['social_readonly_https_token'] ?? null;
    $statuses = ['draft','approved','revision_requested','rejected','publishing','published','manual_review'];
    if (($cfg['social_readonly_https_enabled'] ?? false) !== true
        || ($cfg['social_readonly_https_endpoint'] ?? null) !== $expected
        || !is_string($token) || !preg_match('/^[A-Za-z0-9_-]{32,256}$/D', $token)
        || !in_array($status, [...$statuses, 'all', 'sources'], true) || $page < 1 || $page > 100000
        || ($draftId !== null && !socialHttpsPostId($draftId))) {
        throw new RuntimeException('Private HTTPS reader configuration invalid');
    }
    $params = ['status' => $status, 'page' => (string)$page];
    if ($draftId !== null) $params['draft_id'] = $draftId;
    try {
        // Injection is for server-side tests only; never obtained from configuration or HTTP input.
        $response = ($transport ?? 'socialHttpsRequest')($expected . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986), $token);
        if (!is_array($response) || ($response['status'] ?? null) !== 200
            || !is_string($response['content_type'] ?? null)
            || !preg_match('~^application/json(?:;|$)~i', $response['content_type'])
            || !is_string($response['body'] ?? null) || strlen($response['body']) > 1600000) {
            throw new RuntimeException();
        }
        $result = json_decode($response['body'], true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($result) || !socialHttpsKeys($result, ['contract','readonly','rows','counts','target','history','history_overflow'])
            || $result['contract'] !== 'cdc-social-readonly-v1' || $result['readonly'] !== true
            || !is_array($result['rows']) || !array_is_list($result['rows']) || count($result['rows']) > 50
            || !is_array($result['counts']) || !is_array($result['history']) || !array_is_list($result['history'])
            || count($result['history']) > 1000 || !is_bool($result['history_overflow'])
            || ($status === 'sources' && $result['rows'] !== [])
            || ($status !== 'sources' && ($result['history'] !== [] || $result['history_overflow']))
            || ($result['history_overflow'] && $result['history'] !== [])) throw new RuntimeException();
        $ids = [];
        foreach ($result['rows'] as $row) {
            if (!is_array($row) || !socialHttpsRow($row, false) || isset($ids[$row['id']])
                || ($status !== 'all' && $row['status'] !== $status)) throw new RuntimeException();
            $ids[$row['id']] = true;
        }
        foreach ($result['counts'] as $key => $value)
            if (!in_array($key, $statuses, true) || !is_int($value) || $value < 0) throw new RuntimeException();
        $seen = [];
        foreach ($result['history'] as $row) {
            if (!is_array($row) || !socialHttpsKeys($row, ['source_id','source_fingerprint','status'])
                || !is_string($row['source_id']) || strlen($row['source_id']) > 160 || isset($seen[$row['source_id']])
                || !is_string($row['source_fingerprint']) || strlen($row['source_fingerprint']) > 64
                || !in_array($row['status'], $statuses, true)) throw new RuntimeException();
            $seen[$row['source_id']] = true;
        }
        if ($result['target'] !== null && (!is_array($result['target']) || !socialHttpsRow($result['target'], true)
            || $draftId === null || $result['target']['id'] !== $draftId || $result['target']['status'] !== 'draft'
            || $result['target']['human_decision'] !== null)) throw new RuntimeException();
        return $result;
    } catch (Throwable $error) {
        throw new RuntimeException('Private HTTPS reader unavailable');
    }
}

function socialHttpsPostId(string $id): bool
{
    return (bool)preg_match('/^[1-9][0-9]{0,18}$/D', $id)
        && (strlen($id) < 19 || strcmp($id, '9223372036854775807') <= 0);
}
function socialHttpsKeys(array $value, array $keys): bool
{
    return count($value) === count($keys) && !array_diff($keys, array_keys($value));
}
function socialHttpsRow(array $row, bool $target): bool
{
    $strings = ['id','source_id','source_fingerprint','scheduled_date','facebook_caption','instagram_caption','image_url','status','fb_state','ig_state'];
    $nullable = ['human_decision','decided_at','approved_at','published_at','facebook_post_id','instagram_post_id','instagram_container_id'];
    $keys = $target ? [...$strings, ...$nullable] : [...$strings, ...$nullable, 'source_snapshot','human_note'];
    if (!socialHttpsKeys($row, $keys)) return false;
    foreach ($strings as $key) {
        if ($row[$key] === null && in_array($key, ['facebook_caption','instagram_caption','image_url'], true)) continue;
        if (!is_string($row[$key]) || strlen($row[$key]) > 131072) return false;
    }
    foreach ($nullable as $key) if ($row[$key] !== null && (!is_string($row[$key]) || strlen($row[$key]) > 2048)) return false;
    if (!socialHttpsPostId($row['id']) || !in_array($row['status'], ['draft','approved','revision_requested','rejected','publishing','published','manual_review'], true)) return false;
    if (!$target && (!is_string($row['source_snapshot']) || strlen($row['source_snapshot']) > 131072
        || ($row['human_note'] !== null && (!is_string($row['human_note']) || strlen($row['human_note']) > 131072)))) return false;
    return true;
}

function socialHttpsRequest(string $url, string $token): array
{
    if (!extension_loaded('curl')) throw new RuntimeException();
    $ch = curl_init($url);
    if ($ch === false) throw new RuntimeException();
    $buffer = '';
    try {
        curl_setopt_array($ch, [
            CURLOPT_HTTPGET => true, CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12,
            CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'X-Cdc-Social-Read-Token: ' . $token],
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$buffer): int {
                if (strlen($buffer) + strlen($chunk) > 1600000) return 0;
                $buffer .= $chunk; return strlen($chunk);
            },
        ]);
        if (curl_exec($ch) !== true) throw new RuntimeException();
        return ['status' => (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE),
                'content_type' => (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE), 'body' => $buffer];
    } finally { curl_close($ch); }
}
