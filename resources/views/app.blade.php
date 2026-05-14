<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'SIRIUS') }}</title>
    <link rel="icon" type="image/svg+xml" href="/images/sirius-logo.svg?v=3">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/icon.png?v=3">
    <link rel="icon" type="image/png" sizes="192x192" href="/images/icon.png?v=3">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/icon.png?v=3">
    <link rel="shortcut icon" href="/images/icon.png?v=3">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
