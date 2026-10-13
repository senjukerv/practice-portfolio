<?php
session_start();
header('Content-Type: application/json');
require_once '../config/database.php'; // $pdo connection

$method = $_SERVER['REQUEST_METHOD'];
$input = $_POST; // JS FormData uses POST

// --- Handle POST actions ---
if ($method === 'POST' && isset($input['action'])) {
    $action = $input['action'];

    if ($action === 'create') {
        createOrder($input); // no ID required for new orders
    } else {
        $id = $input['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Order ID is required']);
            exit;
        }

        if ($action === 'delete') {
            deleteOrder($id);
        } elseif ($action === 'update') {
            $quantity = $input['quantity'] ?? null;
            updateOrder($id, $quantity);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    }
} elseif ($method === 'GET') {
    getOrders();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

// ------------------- FUNCTIONS ------------------- //

function createOrder($data) {
    global $pdo;

    $product_id = $data['product_id'] ?? null;
    $quantity   = $data['quantity'] ?? null;

    if (!$product_id || !$quantity) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Product ID and quantity are required']);
        return;
    }

    $quantity = floatval($quantity);

    // --- Get product info ---
    $stmt = $pdo->prepare("SELECT name, price, quantity FROM products WHERE id=?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Product not found']);
        return;
    }

    if ($quantity > $product['quantity']) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Insufficient stock']);
        return;
    }

    $total_amount = $product['price'] * $quantity;

    // --- Get customer info from session ---
    $customer_name    = $_SESSION['customer_name'] ?? 'Guest Customer';
    $customer_address = $_SESSION['address'] ?? '';
    $customer_contact = $_SESSION['contact'] ?? '';

    try {
        $pdo->beginTransaction();

        // Insert order
        $stmt2 = $pdo->prepare("
            INSERT INTO orders (product_id, quantity, total_amount, customer_name, customer_address, customer_contact, order_date)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt2->execute([
            $product_id,
            $quantity,
            $total_amount,
            $customer_name,
            $customer_address,
            $customer_contact
        ]);
        $order_id = $pdo->lastInsertId();

        // Update product stock and status
        $newQuantity = $product['quantity'] - $quantity;
        $status = getStockStatus($newQuantity);

        $stmt3 = $pdo->prepare("UPDATE products SET quantity=?, status=? WHERE id=?");
        $stmt3->execute([$newQuantity, $status, $product_id]);

        $pdo->commit();

        echo json_encode(['success'=>true, 'id'=>$order_id, 'message'=>'Order placed successfully']);

    } catch (Exception $e) {
        $pdo->rollback();
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Failed to create order: '.$e->getMessage()]);
    }
}

function getOrders() {
    global $pdo;

    $customer_name = $_SESSION['customer_name'] ?? 'Guest Customer';

    $stmt = $pdo->prepare("
        SELECT o.id AS order_id, o.product_id, o.quantity, o.total_amount, 
               o.customer_name, o.customer_address, o.customer_contact, o.order_date,
               p.name AS product_name, p.price AS product_price
        FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE o.customer_name = ?
        ORDER BY o.order_date DESC
    ");
    $stmt->execute([$customer_name]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success'=>true,'data'=>$orders]);
}

function deleteOrder($id) {
    global $pdo;

    $stmt = $pdo->prepare("DELETE FROM orders WHERE id=?");
    $success = $stmt->execute([$id]);

    echo json_encode(['success'=>$success,'message'=>$success?'Deleted successfully':'Failed to delete']);
}

function updateOrder($id, $quantity) {
    global $pdo;

    if (!$quantity || $quantity <= 0) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Invalid quantity']);
        return;
    }

    $stmt = $pdo->prepare("SELECT product_id FROM orders WHERE id=?");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Order not found']);
        return;
    }

    $stmt2 = $pdo->prepare("SELECT price FROM products WHERE id=?");
    $stmt2->execute([$order['product_id']]);
    $product = $stmt2->fetch(PDO::FETCH_ASSOC);

    $total_amount = $product['price'] * $quantity;

    $stmt3 = $pdo->prepare("UPDATE orders SET quantity=?, total_amount=? WHERE id=?");
    $success = $stmt3->execute([$quantity, $total_amount, $id]);

    echo json_encode(['success'=>$success,'message'=>$success?'Updated successfully':'Failed to update']);
}

function getStockStatus($quantity) {
    if ($quantity == 0) return 'out-of-stock';
    if ($quantity <= 10) return 'low-stock';
    return 'in-stock';
}
?>
