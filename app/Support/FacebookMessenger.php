<?php

namespace App\Support;

class FacebookMessenger
{
    // Separate public destinations supplied by the resort.
    public const DEFAULT_PAGE_ID = '100083094471286';

    public const DEFAULT_PAGE_URL = 'https://www.facebook.com/profile.php?id=100083094471286';

    public const DEFAULT_MESSENGER_URL = 'https://www.facebook.com/messages/t/101750125870613';

    public static function url(?string $pageUrl): string
    {
        $identifier = self::pageIdentifier($pageUrl);

        // Keep an explicitly supplied Facebook chat link instead of routing it via m.me.
        if ($identifier !== null && preg_match('~^(?:https?://)?[^/?#]+/messages/t/[a-zA-Z0-9.]+/?(?:[?#].*)?$~i', trim($pageUrl ?? ''))) {
            return 'https://www.facebook.com/messages/t/'.$identifier;
        }

        return $identifier !== null ? 'https://m.me/'.$identifier : self::DEFAULT_MESSENGER_URL;
    }

    public static function pageUrl(?string $pageUrl): ?string
    {
        $identifier = self::pageIdentifier($pageUrl);

        if ($identifier === null) {
            return null;
        }

        $pageUrl = trim($pageUrl ?? '');
        $parts = parse_url(preg_match('#^https?://#i', $pageUrl) ? $pageUrl : 'https://'.$pageUrl);

        if (! in_array(strtolower($parts['host'] ?? ''), ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'mbasic.facebook.com', 'fb.com', 'www.fb.com'], true)
            || str_starts_with(trim($parts['path'] ?? '', '/'), 'messages/')) {
            return null;
        }

        return 'https://www.facebook.com/'.(ctype_digit($identifier) ? 'profile.php?id='.$identifier : $identifier);
    }

    public static function pageIdentifier(?string $pageUrl): ?string
    {
        $pageUrl = trim($pageUrl ?? '');

        if ($pageUrl === '') {
            return null;
        }

        $parts = parse_url(preg_match('#^https?://#i', $pageUrl) ? $pageUrl : 'https://'.$pageUrl);

        if (! $parts || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) {
            return null;
        }

        $host = strtolower($parts['host'] ?? '');
        $path = trim($parts['path'] ?? '', '/');
        $segments = explode('/', $path);
        $identifier = null;

        if ($host === 'm.me' && count($segments) === 1) {
            $identifier = $path;
        } elseif (in_array($host, ['messenger.com', 'www.messenger.com'], true) && count($segments) === 2 && $segments[0] === 't') {
            $identifier = $segments[1];
        } elseif (in_array($host, ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'web.facebook.com', 'mbasic.facebook.com', 'fb.com', 'www.fb.com'], true)) {
            if (count($segments) === 3 && $segments[0] === 'messages' && $segments[1] === 't') {
                $identifier = $segments[2];
            } elseif ($path === 'profile.php') {
                parse_str($parts['query'] ?? '', $query);
                $identifier = isset($query['id']) && is_string($query['id']) && ctype_digit($query['id']) ? $query['id'] : null;
            } elseif (count($segments) === 3 && in_array($segments[0], ['pages', 'people'], true) && ctype_digit($segments[2])) {
                $identifier = $segments[2];
            } elseif (count($segments) === 2 && $segments[0] === 'p' && preg_match('/-(\d+)$/', $segments[1], $matches)) {
                $identifier = $matches[1];
            } elseif (count($segments) === 1 && ! in_array(strtolower($path), [
                'share', 'sharer', 'sharer.php', 'login', 'login.php', 'groups', 'events', 'watch', 'reel',
                'reels', 'photo', 'photo.php', 'photos', 'marketplace', 'pages', 'people', 'p', 'messages',
            ], true)) {
                $identifier = $path;
            }
        }

        return is_string($identifier) && preg_match('/^[a-zA-Z0-9.]+$/', $identifier) ? $identifier : null;
    }
}
