<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A booking rule was violated. The message is user facing and shown as a
 * validation error, so it must explain what the person can do next.
 */
class BookingException extends RuntimeException
{
}
