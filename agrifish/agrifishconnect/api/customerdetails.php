<?php
session_start();
header("Content-Type: application/json");

if (isset($_SESSION['customer_id'])) {
    echo json_encode([
        "success" => true,
        "customer_id" => $_SESSION['customer_id'],
        "name" => $_SESSION['customer_name'],
        "email" => $_SESSION['customer_email'] ?? '',
        "address" => $_SESSION['address'] ?? '',
        "contact" => $_SESSION['contact'] ?? ''
    ]);
} else {
    echo json_encode([
        "success" => false,
        "name" => "Guest Customer",
        "address" => "",
        "contact" => ""
    ]);
}
?>
