<?php
declare(strict_types=1);
/**
 * Pure feed comparison + pinned read-only HTTP fetch.
 * The source is EXACTLY the static feed already consumed by n8n Workflow 01.
 * Never writes posts, requests n8n execution, or exposes credentials.
 */
function socialCatalogCandidates(array $feed, array $history): array {
    if (($feed['product'] ?? null) !== 'cuisine-du-cambodge'
        || ($feed['schemaVersion'] ?? null) !== 1 || !isset($feed['items'])
        || !is_array($feed['items']) || count($feed['items']) > 250) {
        throw new UnexpectedValueException('Invalid social feed');
    }
    $unique = [];
    $items = [];
    foreach ($feed['items'] as $raw) {
        if (!is_array($raw)) throw new UnexpectedValueException('Invalid feed item');
        $kind = $raw['kind'] ?? null;
        $id = $raw['id'] ?? null;
        $title = $raw['title'] ?? null;
        $url = $raw['url'] ?? null;
        $fingerprint = $raw['fingerprint'] ?? null;
        if (!is_string($kind) || !in_array($kind, ['recette','culture','atelier','ingredient','technique'], true)
            || !is_string($id) || !preg_match('/^'.preg_quote($kind,'/').':[a-z0-9][a-z0-9-]{0,100}$/D', $id)
            || isset($unique[$id]) || !is_string($title) || trim($title) === ''
            || strlen($title) > 240 || !is_string($fingerprint)
            || !preg_match('/^[a-f0-9]{16}$/D', $fingerprint)
            || !is_string($url) || strlen($url) > 400) {
            throw new UnexpectedValueException('Invalid/duplicate feed item');
        }
        $parsed = parse_url($url);
        if (!is_array($parsed) || ($parsed['scheme'] ?? null) !== 'https'
            || ($parsed['host'] ?? null) !== 'www.cuisine-du-cambodge.com'
            || isset($parsed['user']) || isset($parsed['pass'])
            || isset($parsed['port']) || isset($parsed['query']) || isset($parsed['fragment'])
            || !preg_match('~^/(recettes|culture|apprendre|ingredients|techniques)/[a-z0-9/-]+/?$~D',
                (string)($parsed['path'] ?? ''))) {
            throw new UnexpectedValueException('Invalid feed destination');
        }
        $unique[$id] = true;
        $image = $raw['imageUrl'] ?? null;
        $ready = is_string($image) && (bool)preg_match(
            '~^https://www[.]cuisine-du-cambodge[.]com/social-assets/[a-z0-9-]+[.]jpg$~D', $image);
        $previous = $history[$id] ?? null;
        if (!$ready) {
            $state = 'missing_image';
        } elseif ($previous === null) {
            $state = 'available';
        } elseif ($previous['fingerprint'] !== $fingerprint) {
            $state = 'changed';
        } else {
            $state = 'seen';
        }
        $items[] = ['id'=>$id,'kind'=>$kind,'title'=>$title,'url'=>$url,
                    'state'=>$state,'previous_status'=>$previous['status'] ?? null];
    }
    $rank=['available'=>0,'changed'=>1,'missing_image'=>2,'seen'=>3];
    usort($items, static fn($a,$b): int =>
        ($rank[$a['state']] <=> $rank[$b['state']])
        ?: strcmp($a['id'],$b['id']));
    return $items;
}
/** Returns null on network/unavailable feed (not an empty catalogue). */
function readDeployedSocialFeed(): ?array {
    if (!function_exists('curl_init')) return null;
    $url='https://www.cuisine-du-cambodge.com/social-feed.json';
    $curl=curl_init($url);
    if ($curl === false) return null;
    $body='';
    curl_setopt_array($curl, [
        CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_CONNECTTIMEOUT=>3,
        CURLOPT_TIMEOUT=>5,
        CURLOPT_SSL_VERIFYPEER=>true,
        CURLOPT_SSL_VERIFYHOST=>2,
        CURLOPT_HTTPGET=>true,
        CURLOPT_HTTPHEADER=>['Accept: application/json'],
        CURLOPT_WRITEFUNCTION=>static function ($ch,string $data) use (&$body): int {
            if (strlen($body)+strlen($data)>524288) return 0;
            $body.=$data;
            return strlen($data);
        }
    ]);
    if (defined('CURLOPT_PROTOCOLS_STR')) {
        curl_setopt($curl, constant('CURLOPT_PROTOCOLS_STR'), 'https');
    } elseif (defined('CURLOPT_PROTOCOLS')) {
        curl_setopt($curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
    }
    $ok=curl_exec($curl);
    $status=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if ($ok !== true || $status !== 200 || $body === '') return null;
    try {
        $json=json_decode($body,true,32,JSON_THROW_ON_ERROR);
        return is_array($json)?$json:null;
    } catch (JsonException $e) {
        return null;
    }
}
