<?php
session_start();
header("Content-Type: application/json");
require_once '../config/database.php'; // $pdo connection

// Turn off all warnings in JSON output
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['password'])) {
    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);
    exit;
}

// Clear any existing session
session_unset();
session_destroy();
session_start();

$email = trim($data['email']);
$password = trim($data['password']);

try {
    $stmt = $pdo->prepare("SELECT * FROM register WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
        exit;
    }

    // Common fields
    $middlename = !empty($user['middlename']) ? $user['middlename'] : '';
    $address    = !empty($user['address']) ? $user['address'] : 'No Address';
    $contact    = !empty($user['contact']) ? $user['contact'] : 'No Contact';

    if ($user['user_type'] === 'admin') {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['full_name'] = trim($user['firstname'] . ' ' . $middlename . ' ' . $user['lastname']);
        $_SESSION['user_type'] = 'admin';
        $redirect = 'dashboard.html';
    } else {
        $_SESSION['customer_id'] = $user['id'];
        $_SESSION['customer_name'] = trim($user['firstname'] . ' ' . $middlename . ' ' . $user['lastname']);
        $_SESSION['customer_email'] = $user['email'];
        $_SESSION['address'] = $address;
        $_SESSION['contact'] = $contact;
        $_SESSION['user_type'] = 'customer';
        $redirect = 'index.html';
    }

    echo json_encode([
        "success" => true,
        "message" => "Login successful!",
        "redirect" => $redirect,
        "user" => [
            "id" => $user['id'],
            "firstname" => $user['firstname'],
            "middlename" => $middlename,
            "lastname" => $user['lastname'],
            "email" => $user['email'],
            "user_type" => $user['user_type'],
            "address" => $address,
            "contact" => $contact
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
