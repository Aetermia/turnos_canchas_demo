<?php

namespace App\Support;

/**
 * Local-only shorthand login: a bare username such as "admin" maps to a
 * reserved domain, so the users table still holds a valid address. The mapping
 * is only applied when APP_ENV is local; everywhere else a username without
 * "@" is rejected by the email rule, exactly as before.
 */
final class LocalAccount
{
    public const DOMAIN = 'local.test';

    public static function email(string $username): string
    {
        return mb_strtolower(trim($username)).'@'.self::DOMAIN;
    }
}
