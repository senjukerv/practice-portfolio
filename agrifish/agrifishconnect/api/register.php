<?php
session_start();
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['firstname']) || empty($data['lastname']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

$firstname = trim($data['firstname']);
$middlename = trim($data['middlename'] ?? '');
$lastname  = trim($data['lastname']);
$email     = trim($data['email']);
$password  = password_hash($data['password'], PASSWORD_DEFAULT);
$address   = trim($data['address'] ?? '');
$contact   = trim($data['contact'] ?? '');
$user_type = $data['user_type'] ?? 'customer';

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM register WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Email already registered."
        ]);
        exit;
    }

    // Insert new user
    $stmt = $pdo->prepare("
        INSERT INTO register 
        (firstname, middlename, lastname, contact, address, email, password, user_type) 
        VALUES (:firstname, :middlename, :lastname, :contact, :address, :email, :password, :user_type)
    ");
    $stmt->execute([
        ':firstname' => $firstname,
        ':middlename' => $middlename,
        ':lastname'  => $lastname,
        ':contact'   => $contact,
        ':address'   => $address,
        ':email'     => $email,
        ':password'  => $password,
        ':user_type' => $user_type
    ]);

    $userId = $pdo->lastInsertId();

    // --- Automatically log in the user after registration ---
    if ($user_type === 'admin') {
        $_SESSION['user_id']   = $userId;
        $_SESSION['full_name'] = trim($firstname . ' ' . $middlename . ' ' . $lastname);
        $_SESSION['user_type'] = 'admin';
        $redirect = 'login.html';
    } else {
        $_SESSION['customer_id'] = $userId;
        $_SESSION['customer_name'] = trim($firstname . ' ' . $middlename . ' ' . $lastname);
        $_SESSION['customer_email'] = $email;
        $_SESSION['address'] = $address ?: 'No Address';
        $_SESSION['contact'] = $contact ?: 'No Contact';
        $_SESSION['user_type'] = 'customer';
        $redirect = 'login.html';
    }

    echo json_encode([
        "success" => true,
        "message" => "Registration successful! You are now logged in.",
        "redirect" => $redirect
    ]);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
