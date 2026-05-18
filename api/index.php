<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Ensure all required writable folders exist inside the Vercel /tmp filesystem
$writableDirs = [
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/cache',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/bootstrap/cache'
];

foreach ($writableDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Register the Composer autoloader using reliable absolute paths
require realpath(__DIR__ . '/../vendor/autoload.php');

// Bootstrap Laravel and handle the request using realpath
/** @var Application $app */
$app = require_once realpath(__DIR__ . '/../bootstrap/app.php');

$app->handleRequest(Request::capture());
