<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once '../config/database.php'; // $pdo connection

$method = $_SERVER['REQUEST_METHOD'];
$input = $_POST;

// get logged in user info
$user_id = $_SESSION['user_id'] ?? null;
$user_type = $_SESSION['user_type'] ?? 'guest customer';

switch ($method) {
    case 'POST':
        $action = $input['action'] ?? null;
        $id = $input['id'] ?? null;

        if ($action === 'delete') {
            if (!$id) exit(json_encode(['success'=>false,'message'=>'Order ID required']));
            deleteOrder($id);

        } elseif ($action === 'update') {
            $quantity = $input['quantity'] ?? null;
            if (!$id || !$quantity) exit(json_encode(['success'=>false,'message'=>'ID & quantity required']));
            updateOrder($id, $quantity);

        } elseif ($action === 'create') {
            $product_id = $input['product_id'] ?? null;
            $quantity   = $input['quantity'] ?? null;

            if (!$product_id || !$quantity) {
                exit(json_encode(['success'=>false,'message'=>'Product ID & quantity required']));
            }

            // Customer info from session
            $customer_name    = $_SESSION['customer_name'] ?? 'Guest Customer';
            $customer_address = $_SESSION['address'] ?? '';
            $customer_contact = $_SESSION['contact'] ?? '';

            // Get product details (including seller_id)
            $stmt = $pdo->prepare("SELECT price, seller_id FROM products WHERE id=?");
            $stmt->execute([$product_id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$product) exit(json_encode(['success'=>false,'message'=>'Product not found']));

            $total_amount = $product['price'] * $quantity;
            $seller_id = $product['seller_id'];

            // Insert order linked to product's seller
            $stmt2 = $pdo->prepare("
                INSERT INTO orders (product_id, quantity, total_amount, customer_name, customer_address, customer_contact, order_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $success = $stmt2->execute([
                $product_id,
                $quantity,
                $total_amount,
                $customer_name,
                $customer_address,
                $customer_contact
            ]);

            exit(json_encode(['success'=>$success,'message'=>$success?'Order placed':'Failed to create order']));

        } else {
            exit(json_encode(['success'=>false,'message'=>'Invalid action']));
        }
        break;

    case 'GET':
    default:
        getOrders($user_type, $user_id);
        break;
}

// --- FUNCTIONS ---

function getOrders($user_type, $user_id) {
    global $pdo;

    try {
        if ($user_type === 'admin') {
            // Admin: only see orders for their products
            $stmt = $pdo->prepare("
                SELECT 
                    o.id AS order_id,
                    o.product_id,
                    o.quantity,
                    o.total_amount,
                    o.customer_name,
                    o.customer_address,
                    o.customer_contact,
                    o.order_date,
                    p.name AS product_name,
                    p.price AS product_price
                FROM orders o
                JOIN products p ON o.product_id = p.id
                WHERE p.seller_id = ?
                ORDER BY o.order_date DESC
            ");
            $stmt->execute([$user_id]);

        } elseif ($user_type === 'guest customer') {
            // Customer: only see their own orders
            $stmt = $pdo->prepare("
                SELECT 
                    o.id AS order_id,
                    o.product_id,
                    o.quantity,
                    o.total_amount,
                    o.customer_name,
                    o.customer_address,
                    o.customer_contact,
                    o.order_date,
                    p.name AS product_name,
                    p.price AS product_price
                FROM orders o
                JOIN products p ON o.product_id = p.id
                WHERE o.customer_name = (
                    SELECT CONCAT(firstname, ' ', lastname) FROM register WHERE id = ?
                )
                ORDER BY o.order_date DESC
            ");
            $stmt->execute([$user_id]);

        } else {
            echo json_encode(['success'=>false,'data'=>[]]);
            return;
        }

        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success'=>true,'data'=>$orders]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Failed: '.$e->getMessage()]);
    }
}

function deleteOrder($id) {
    global $pdo;
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id=?");
    $success = $stmt->execute([$id]);
    echo json_encode(['success'=>$success,'message'=>$success?'Deleted successfully':'Failed to delete']);
}

function updateOrder($id, $quantity) {
    global $pdo;

    $stmt = $pdo->prepare("SELECT product_id FROM orders WHERE id=?");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) exit(json_encode(['success'=>false,'message'=>'Order not found']));

    $stmt2 = $pdo->prepare("SELECT price FROM products WHERE id=?");
    $stmt2->execute([$order['product_id']]);
    $product = $stmt2->fetch(PDO::FETCH_ASSOC);
    if (!$product) exit(json_encode(['success'=>false,'message'=>'Product not found']));

    $total_amount = $product['price'] * $quantity;

    $stmt3 = $pdo->prepare("UPDATE orders SET quantity=?, total_amount=? WHERE id=?");
    $success = $stmt3->execute([$quantity, $total_amount, $id]);

    echo json_encode(['success'=>$success,'message'=>$success?'Updated successfully':'Failed to update']);
}
?>
