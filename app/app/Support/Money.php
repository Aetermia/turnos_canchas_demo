<?php

namespace App\Support;

/**
 * Money is kept as integer cents and shown as ARS. No intl extension is assumed
 * (DonWeb's php.ini is not verified), so formatting is manual.
 */
final class Money
{
    public static function format(int $cents, string $currency = 'ARS'): string
    {
        $symbol = $currency === 'ARS' ? '$' : $currency.' ';
        $decimals = $cents % 100 === 0 ? 0 : 2;

        return $symbol.' '.number_format($cents / 100, $decimals, ',', '.');
    }
}
