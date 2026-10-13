// Dashboard logic for Agrifish Connect
// Enhanced macOS-inspired admin dashboard with database integration

// --- Global variables ---
let inventory = [];

// --- Utility functions ---
function formatPrice(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toFixed(2);
}

function getStockStatus(quantity) {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= 10) return "low-stock";
  return "in-stock";
}

function getStatusText(status) {
  switch (status) {
    case "in-stock": return "In Stock";
    case "low-stock": return "Low Stock";
    case "out-of-stock": return "Out of Stock";
    default: return "Unknown";
  }
}

// --- API functions ---
async function fetchProducts() {
  try {
    const response = await fetch("http://localhost/agrifish/agrifishconnect/api/products.php", {
        credentials: "include" // ✅ add this to ensure PHP session is sent
    });
    const result = await response.json();
    if (result.success) {
      inventory = result.data;
      renderInventory();
    } else {
      showNotification("Failed to fetch products", "error");
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    showNotification("Error connecting to server", "error");
  }
}


async function createProduct(productData) {
  try {
    const response = await fetch("http://localhost/agrifish/agrifishconnect/api/products.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    const result = await response.json();
    if (result.success) {
      showNotification("Product added successfully!");
      fetchProducts();
    } else {
      showNotification("Failed to add product", "error");
    }
  } catch (error) {
    console.error("Error creating product:", error);
    showNotification("Error connecting to server", "error");
  }
}

async function updateProduct(productData) {
  try {
    const response = await fetch("http://localhost/agrifish/agrifishconnect/api/products.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!response.ok) throw new Error("Network response was not OK");
    const result = await response.json();

    if (result.success) {
      showNotification(result.message || "Product updated successfully!");
      fetchProducts();
    } else {
      showNotification(result.message || "Failed to update product", "error");
    }
  } catch (error) {
    console.error("Error updating product:", error);
    showNotification("Error connecting to server", "error");
  }
}

async function deleteProductFromDB(id) {
  try {
    const response = await fetch("http://localhost/agrifish/agrifishconnect/api/products.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id }),
    });
    const result = await response.json();
    if (result.success) {
      showNotification("Product deleted successfully!");
      fetchProducts();
    } else {
      showNotification("Failed to delete product", "error");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    showNotification("Error connecting to server", "error");
  }
}

// --- Render inventory table ---
function renderInventory() {
  const tbody = document.getElementById("inventory-body");
  tbody.innerHTML = "";

  inventory.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-select" data-id="${item.id}"></td>
      <td><img src="${item.image}" alt="${item.name}" onerror="this.src='http://localhost/agrifish/agrifishconnect/images/sample.jpg'"></td>
      <td>
        <div style="font-weight:600;color:#1d1d1f;margin-bottom:2px;">${item.name}</div>
        <div style="font-size:12px;color:#6b7280;">SKU: ${item.id.toString().padStart(4, "0")}</div>
      </td>
      <td><div style="font-weight:600;color:#1d1d1f;">${item.quantity} kg</div></td>
      <td><div style="font-weight:600;color:#1d1d1f;">${formatPrice(item.price)}</div></td>
      <td><span class="status-badge ${item.status}">${getStatusText(item.status)}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-btn edit" onclick="openEditModal(${item.id})" title="Edit">✏️</button>
          <button class="table-btn delete" onclick="deleteFish(${item.id})" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateSummary();
}

// --- Update summary ---
function updateSummary() {
  const totalStock = inventory.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
  document.getElementById("total-stock").textContent = totalStock + " kg";

  const totalValue = inventory.reduce((sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.price), 0);
  document.getElementById("total-value").textContent = formatPrice(totalValue);
}

// --- Modal logic ---
const dashboardModal = document.getElementById("dashboard-modal");
const fishForm = document.getElementById("fish-form");
const modalActionTitle = document.getElementById("modal-action-title");
const cancelDashboardModal = document.getElementById("cancel-dashboard-modal");
let editId = null;

document.getElementById("add-fish-btn").addEventListener("click", () => {
  modalActionTitle.textContent = "Add New Product";
  fishForm.reset();
  editId = null;
  dashboardModal.classList.add("active");
  dashboardModal.setAttribute("aria-hidden", "false");
  document.getElementById("fish-name").focus();
});

window.openEditModal = function(id) {
  const item = inventory.find(f => f.id == id);
  if (!item) return;
  modalActionTitle.textContent = "Edit Product";
  document.getElementById("fish-name").value = item.name;
  document.getElementById("fish-quantity").value = item.quantity;
  document.getElementById("fish-price").value = item.price;
  document.getElementById("fish-image").value = item.image;
  editId = id;
  dashboardModal.classList.add("active");
  dashboardModal.setAttribute("aria-hidden", "false");
  document.getElementById("fish-name").focus();
};

fishForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("fish-name").value.trim();
  const quantity = parseFloat(document.getElementById("fish-quantity").value);
  const price = parseFloat(document.getElementById("fish-price").value);
  const image = document.getElementById("fish-image").value.trim();
  if (!name || isNaN(quantity) || isNaN(price) || !image) return;

  const productData = { name, quantity, price, image };
  if (editId) {
    productData.id = editId;
    updateProduct(productData);
  } else {
    createProduct(productData);
  }
  closeDashboardModal();
});

window.deleteFish = function(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    deleteProductFromDB(id);
  }
};

cancelDashboardModal.addEventListener("click", closeDashboardModal);
dashboardModal.querySelector(".modal-overlay").addEventListener("click", closeDashboardModal);
document.addEventListener("keydown", e => {
  if (dashboardModal.classList.contains("active") && e.key === "Escape") closeDashboardModal();
});

function closeDashboardModal() {
  dashboardModal.classList.remove("active");
  dashboardModal.setAttribute("aria-hidden", "true");
  fishForm.reset();
  editId = null;
}

// --- Notifications ---
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">×</button>`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : "#ef4444"};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  setTimeout(() => { notification.parentElement && notification.remove(); }, 3000);
}

const style = document.createElement("style");
style.textContent = `
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);

// --- Initialize dashboard ---
document.addEventListener("DOMContentLoaded", function() {
  fetchProducts();

 // Display logged-in admin name
const adminNameEl = document.getElementById("admin-fullname");
if (adminNameEl) {
  fetch("http://localhost/agrifish/agrifishconnect/api/getuser.php", {
     credentials: 'include' // ✅ FIXED: ensures PHP session cookie is sent
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.full_name) {
      adminNameEl.textContent = data.full_name.toUpperCase();
    } else {
      adminNameEl.textContent = "GUEST";
    }

    // Apply styles
    adminNameEl.style.fontWeight = "bold";
    adminNameEl.style.textAlign = "left";
    adminNameEl.style.fontSize = "18px";
    adminNameEl.style.color = "#1d1d1f";
  })
  .catch(err => {
    console.error("Failed to fetch admin name:", err);
    adminNameEl.textContent = "GUEST";
  });
}


  // Nav click listeners
  const productsNav = document.getElementById("nav-products");
  if (productsNav) productsNav.addEventListener("click", () => { window.location.href = "adminview.html"; });

  const messageNav = document.getElementById("nav-message");
  if (messageNav) messageNav.addEventListener("click", () => { window.location.href = "https://www.facebook.com/profile.php?id=61583233691669"; });

  const itemNav = document.getElementById("nav-item");
  if (itemNav) itemNav.addEventListener("click", () => { window.location.href = "vieworder.html"; });
});

// --- Export ---
const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
  exportBtn.addEventListener("click", function() {
    const csvContent = "data:text/csv;charset=utf-8,ID,Name,Quantity,Price,Status\n" +
      inventory.map(item => `${item.id},"${item.name}",${item.quantity},${item.price},"${getStatusText(item.status)}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Inventory exported successfully!");
  });
}

// --- Logout ---
document.querySelector(".logout-btn").addEventListener("click", function() {
  if (confirm("Are you sure you want to logout?")) {
    showNotification("Logging out...");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
  }
});
