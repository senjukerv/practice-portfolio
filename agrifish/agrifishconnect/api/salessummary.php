<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once '../config/database.php'; // $pdo connection

// Get logged-in admin info
$user_id = $_SESSION['user_id'] ?? null;
$user_type = $_SESSION['user_type'] ?? 'guest';

if (!$user_id || $user_type !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    // --- Daily Sales ---
    $stmt = $pdo->prepare("
        SELECT DATE(o.order_date) AS day, SUM(o.total_amount) AS total
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE p.seller_id = :seller_id
        GROUP BY DATE(o.order_date)
        ORDER BY DATE(o.order_date) DESC
    ");
    $stmt->execute(['seller_id' => $user_id]);
    $daily = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Monthly Sales ---
    $stmt = $pdo->prepare("
        SELECT YEAR(o.order_date) AS year, MONTH(o.order_date) AS month, SUM(o.total_amount) AS total
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE p.seller_id = :seller_id
        GROUP BY YEAR(o.order_date), MONTH(o.order_date)
        ORDER BY YEAR(o.order_date) DESC, MONTH(o.order_date) DESC
    ");
    $stmt->execute(['seller_id' => $user_id]);
    $monthly = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- Yearly Sales ---
    $stmt = $pdo->prepare("
        SELECT YEAR(o.order_date) AS year, SUM(o.total_amount) AS total
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE p.seller_id = :seller_id
        GROUP BY YEAR(o.order_date)
        ORDER BY YEAR(o.order_date) DESC
    ");
    $stmt->execute(['seller_id' => $user_id]);
    $yearly = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'daily' => $daily,
        'monthly' => $monthly,
        'yearly' => $yearly
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed: '.$e->getMessage()]);
}
?>
