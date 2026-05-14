<?php

declare(strict_types=1);

$sqlitePath = __DIR__ . '/../database/database.sqlite';

if (!file_exists($sqlitePath)) {
    fwrite(STDERR, "SQLite database not found at {$sqlitePath}" . PHP_EOL);
    exit(1);
}

$sqlite = new PDO('sqlite:' . $sqlitePath);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$mysql = new PDO('mysql:host=127.0.0.1;port=3306;dbname=gym_store_pro;charset=utf8mb4', 'root', '');
$mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = [
    'users',
    'products',
    'orders',
    'order_items',
    'wishlists',
    'product_reviews',
    'recently_viewed_products',
    'activity_logs',
];

function hasSqliteTable(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = :name LIMIT 1");
    $stmt->execute(['name' => $table]);

    return (bool) $stmt->fetchColumn();
}

function hasMysqlTable(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare('SHOW TABLES LIKE :name');
    $stmt->execute(['name' => $table]);

    return (bool) $stmt->fetchColumn();
}

$mysql->exec('SET FOREIGN_KEY_CHECKS=0');

foreach ($tables as $table) {
    if (!hasSqliteTable($sqlite, $table) || !hasMysqlTable($mysql, $table)) {
        echo $table . ':skip' . PHP_EOL;
        continue;
    }

    $rows = $sqlite->query('SELECT * FROM ' . $table)->fetchAll(PDO::FETCH_ASSOC);

    if (!$rows) {
        echo $table . ':0' . PHP_EOL;
        continue;
    }

    $columns = $mysql->query('DESCRIBE ' . $table)->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_map(static fn (array $column): string => $column['Field'], $columns);

    $placeholders = implode(', ', array_fill(0, count($columnNames), '?'));
    $columnsSql = implode(', ', array_map(static fn (string $column): string => "`{$column}`", $columnNames));

    $updateColumns = array_values(array_filter($columnNames, static fn (string $column): bool => $column !== 'id'));
    $updateSql = implode(', ', array_map(static fn (string $column): string => "`{$column}`=VALUES(`{$column}`)", $updateColumns));

    $sql = "INSERT INTO `{$table}` ({$columnsSql}) VALUES ({$placeholders})";

    if ($updateSql !== '') {
        $sql .= " ON DUPLICATE KEY UPDATE {$updateSql}";
    }

    $statement = $mysql->prepare($sql);

    foreach ($rows as $row) {
        $payload = [];

        foreach ($columnNames as $columnName) {
            $payload[] = $row[$columnName] ?? null;
        }

        $statement->execute($payload);
    }

    echo $table . ':' . count($rows) . PHP_EOL;
}

$mysql->exec('SET FOREIGN_KEY_CHECKS=1');

echo 'sync:done' . PHP_EOL;
