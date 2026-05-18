# Laravel SPA Vercel Deployment Handover Report

This document outlines the system architecture, configuration files, historical issues, and the current status of deploying the Laravel + React (Vite SPA) project named **gym-store-pro** onto **Vercel** to assist in debugging and completing the deployment.

---

## 1. Project Tech Stack & Architecture
* **Backend:** Laravel 11/13 framework (PHP ^8.3 constraint in `composer.json`).
* **Frontend:** Single Page Application (SPA) built with React and compiled via Vite.
* **Build Outputs:** Vite compiles assets into `public/build/`.
* **Hosting Platform:** Vercel (using the community-supported `vercel-php@0.9.0` serverless runtime).
* **Vercel Project Preset:** Configured as `Other` (with `Override` options set in Vercel settings).

---

## 2. File Configurations & Project Structure

### A. `vercel.json` (Root Directory)
This is the current routing and build configuration:
```json
{
    "version": 2,
    "framework": null,
    "outputDirectory": "public",
    "functions": {
        "api/index.php": {
            "runtime": "vercel-php@0.9.0",
            "includeFiles": [
                "app/**",
                "bootstrap/**",
                "config/**",
                "database/**",
                "routes/**",
                "vendor/**",
                "public/**"
            ]
        }
    },
    "routes": [
        {
            "src": "/build/(.*)",
            "dest": "/public/build/$1"
        },
        {
            "src": "/(css|js|images|fonts|favicon.ico|robots.txt)/(.*)",
            "dest": "/public/$1/$2"
        },
        {
            "src": "/(.*)",
            "dest": "/api/index.php"
        }
    ]
}
```

### B. `api/index.php` (Root `/api` Folder)
To bypass Vercel's static asset router serving `.php` files as raw text downloads, the main entry point is a serverless function inside `api/index.php` that bootstraps Laravel directly:
```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
```

### C. `.vercelignore` (Root Directory)
We explicitly ignore `/public/index.php` from being uploaded as a static file, preventing Vercel from exposing it as a downloadable raw file at `/`:
```text
/vendor
/node_modules
.env
.phpunit.result.cache
/storage/*.key
/storage/framework
/storage/logs
/public/index.php
```

---

## 3. History of Issues & Attempted Fixes

### ⚠️ Issue 1: `index.php` Downloading as Raw Text File
* **Symptom:** Opening `siruis.vercel.app` results in the browser downloading `index.php` (125 bytes) instead of rendering the site.
* **Cause:** Vercel was treating the `index.php` in the output directory as a static file. 
* **Fix applied:** 
  1. We moved the bootstrapping logic into `/api/index.php` (which runs inside the PHP lambda runtime).
  2. We added `/public/index.php` to `.vercelignore` so that Vercel does not publish it as a static asset, preventing the static router from serving it.

### ⚠️ Issue 2: Build Fails with `No Output Directory named "dist" found`
* **Symptom:** Vercel build failed during compilation, demanding a `dist` folder.
* **Cause:** Vercel's automated builder detected Vite and ran `vite build`, expecting a standard SPA `dist` output.
* **Fix applied:** We set `"outputDirectory": "public"` in `vercel.json` because Laravel's Vite output is compiled into the `public/build` directory, and satisfying Vercel's output requirement avoids build failures.

### ⚠️ Issue 3: Serverless Function Crashes with HTTP 500
* **Symptom:** Navigating to the page returned a blank page or a generic `HTTP ERROR 500`.
* **Cause:** By default, Vercel isolates the `/api` directory for serverless functions, leaving out all root directories (`app`, `bootstrap`, `routes`, `vendor`). Therefore, the function `api/index.php` failed to load files like `autoload.php` or `app.php`.
* **Fix applied:** We added the `"includeFiles"` property in `vercel.json` inside the `functions` configuration to bundle the entire Laravel application workspace inside the serverless execution sandbox.

---

## 4. Current State
* The latest git commit is `6f6af6b` (or newer).
* Environment variables (`APP_KEY`, `SESSION_DRIVER`, `APP_DEBUG`, `APP_URL`) are successfully configured under Vercel Project Settings.
* If a 500 error persists, check Vercel **Logs** tab under deployments for the exact PHP fatal traceback.
