<?php

namespace Tests;

use App\Models\EstablishmentSetting;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The settings row is cached per request in production; tests share a process.
        EstablishmentSetting::forgetCache();
    }
}
