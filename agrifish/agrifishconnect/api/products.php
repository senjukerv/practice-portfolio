<?php
// --- Fixed CRUD PHP with admin/product ownership ---
session_start();
header("Content-Type: application/json"); // Ensure JSON response
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Get logged-in user from session
$user_id = $_SESSION['user_id'] ?? null;
$user_type = $_SESSION['user_type'] ?? 'guest customer';

switch($method) {
    case 'GET':
        getProducts($user_id, $user_type);
        break;
    case 'POST':
        createProduct($input, $user_id, $user_type);
        break;
    case 'PUT':
        updateProduct($input, $user_id, $user_type);
        break;
    case 'DELETE':
        deleteProduct($input, $user_id, $user_type);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

// --- Get all products ---
function getProducts($user_id, $user_type) {
    global $pdo;
    try {
        if ($user_type === 'admin' && $user_id) {
            // Admin sees only their own products
            $stmt = $pdo->prepare("SELECT * FROM products WHERE seller_id=? ORDER BY created_at DESC");
            $stmt->execute([$user_id]);
        } else {
            // Customers see all in-stock products
            $stmt = $pdo->query("SELECT * FROM products WHERE status='in-stock' ORDER BY created_at DESC");
        }

        $products = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $products]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to fetch products: ' . $e->getMessage()]);
    }
}

// --- Create product ---
function createProduct($data, $user_id, $user_type) {
    global $pdo;
    try {
        if ($user_type !== 'admin' || !$user_id) {
            echo json_encode(['success'=>false,'message'=>'Unauthorized']);
            return;
        }

        $quantity = floatval($data['quantity']);
        $status = getStockStatus($quantity);

        $stmt = $pdo->prepare("INSERT INTO products (seller_id, name, quantity, price, image, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $user_id,
            $data['name'],
            $quantity,
            floatval($data['price']),
            $data['image'] ?? null,
            $status
        ]);

        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $newId, 'message' => 'Product created successfully']);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create product: ' . $e->getMessage()]);
    }
}

// --- Update product ---
function updateProduct($data, $user_id, $user_type) {
    global $pdo;
    try {
        if (!$data['id'] || !$user_id) {
            echo json_encode(['success'=>false,'message'=>'Unauthorized']);
            return;
        }

        // Check if admin owns the product
        if ($user_type === 'admin') {
            $stmtCheck = $pdo->prepare("SELECT seller_id FROM products WHERE id=?");
            $stmtCheck->execute([intval($data['id'])]);
            $product = $stmtCheck->fetch();
            if (!$product || $product['seller_id'] != $user_id) {
                echo json_encode(['success'=>false,'message'=>'Cannot edit this product']);
                return;
            }
        }

        $quantity = floatval($data['quantity']);
        $status = getStockStatus($quantity);

        $stmt = $pdo->prepare("UPDATE products SET name=?, quantity=?, price=?, image=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?");
        $stmt->execute([
            $data['name'],
            $quantity,
            floatval($data['price']),
            $data['image'] ?? null,
            $status,
            intval($data['id'])
        ]);

        echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update product: ' . $e->getMessage()]);
    }
}

// --- Delete product ---
function deleteProduct($data, $user_id, $user_type) {
    global $pdo;
    try {
        if (!$data['id'] || !$user_id) {
            echo json_encode(['success'=>false,'message'=>'Unauthorized']);
            return;
        }

        // Check if admin owns the product
        if ($user_type === 'admin') {
            $stmtCheck = $pdo->prepare("SELECT seller_id FROM products WHERE id=?");
            $stmtCheck->execute([intval($data['id'])]);
            $product = $stmtCheck->fetch();
            if (!$product || $product['seller_id'] != $user_id) {
                echo json_encode(['success'=>false,'message'=>'Cannot delete this product']);
                return;
            }
        }

        $stmt = $pdo->prepare("DELETE FROM products WHERE id=?");
        $stmt->execute([intval($data['id'])]);

        echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete product: ' . $e->getMessage()]);
    }
}

// --- Helper ---
function getStockStatus($quantity) {
    if ($quantity == 0) return 'out-of-stock';
    if ($quantity <= 10) return 'low-stock';
    return 'in-stock';
}
?>
