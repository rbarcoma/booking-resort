<?php

namespace App\Support;

use DOMDocument;

class GoogleMapsEmbed
{
    public static function url(?string $value): ?string
    {
        $value = trim($value ?? '');

        // Google supplies an iframe through Share > Embed a map > Copy HTML.
        // Extract only its URL; never render administrator-supplied HTML.
        if (str_starts_with($value, '<')) {
            $document = new DOMDocument;
            $document->loadHTML($value, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
            $frames = $document->getElementsByTagName('iframe');

            if ($frames->length !== 1) {
                return null;
            }

            $value = $frames->item(0)->getAttribute('src');
        }

        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $parts = parse_url($value);

        if (! $parts || ($parts['scheme'] ?? '') !== 'https'
            || ! in_array(strtolower($parts['host'] ?? ''), ['www.google.com', 'google.com', 'maps.google.com'], true)
            || ($parts['path'] ?? '') !== '/maps/embed'
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) {
            return null;
        }

        parse_str($parts['query'] ?? '', $query);

        if (! is_string($query['pb'] ?? null) || ! str_starts_with($query['pb'], '!')) {
            return null;
        }

        return 'https://www.google.com/maps/embed?'.http_build_query(['pb' => $query['pb']], '', '&', PHP_QUERY_RFC3986);
    }
}
