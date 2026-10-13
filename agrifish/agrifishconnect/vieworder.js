let allOrders = [];

document.addEventListener("DOMContentLoaded", () => {

  // --- Store logged-in user details ---
  let sessionUser = {
    name: "Guest Customer",
    address: "",
    contact: ""
  };

  // --- Fetch logged-in customer session details ---
  async function fetchSessionUser() {
    try {
      const res = await fetch("http://localhost/agrifish/agrifishconnect/api/customerdetails.php", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success && data.user) {
        sessionUser.name = `${data.user.firstname} ${data.user.lastname}`.trim();
        sessionUser.address = data.user.address || "";
        sessionUser.contact = data.user.contact || "";
      }
    } catch (err) {
      console.error("⚠️ Failed to fetch session user:", err);
    }
  }

  // --- Fetch orders ---
  async function fetchOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading orders...</div>';

    try {
      const res = await fetch("http://localhost/agrifish/agrifishconnect/api/orderlist.php", {
        credentials: "include"
      });
      const result = await res.json();
      if (!result.success || !result.data || result.data.length === 0) {
        container.innerHTML = '<div class="no-orders">No orders found.</div>';
        return;
      }

      allOrders = result.data;
      renderOrders(allOrders);
    } catch (err) {
      console.error("⚠️ Failed to load orders:", err);
      container.innerHTML = '<div class="no-orders">Unable to load orders.</div>';
    }
  }

  // --- Render orders ---
  function renderOrders(orders) {
    const container = document.getElementById("orders-container");
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div class="no-orders">No orders found.</div>';
      return;
    }

    let html = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Product Name</th>
            <th>Quantity (kg)</th>
            <th>Total Amount</th>
            <th>Customer Name</th>
            <th>Address</th>
            <th>Contact</th>
            <th>Order Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    orders.forEach(o => {
      const id = o.order_id ?? o.id;
      html += `
        <tr>
          <td>${id}</td>
          <td>${o.product_name || "-"}</td>
          <td>${o.quantity}</td>
          <td>₱${Number(o.total_amount).toFixed(2)}</td>
          <td>${o.customer_name || sessionUser.name}</td>
          <td>${o.customer_address || sessionUser.address}</td>
          <td>${o.customer_contact || sessionUser.contact}</td>
          <td>${o.order_date ? new Date(o.order_date).toLocaleString() : "-"}</td>
          <td>
            <button class="edit-btn" data-id="${id}">✏️</button>
            <button class="delete-btn" data-id="${id}">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    attachButtons();
  }

  // --- Attach buttons ---
  function attachButtons() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => editOrder(Number(btn.dataset.id)));
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteOrder(Number(btn.dataset.id)));
    });
  }

  // --- Search orders ---
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const val = searchInput.value.toLowerCase().trim();
      const filtered = allOrders.filter(o =>
        (o.customer_name || "").toLowerCase().includes(val) ||
        (o.product_name || "").toLowerCase().includes(val)
      );
      renderOrders(filtered);
    });
  }

  // --- Delete order ---
  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;

    const form = new FormData();
    form.append("action", "delete");
    form.append("id", id);

    try {
      const res = await fetch("http://localhost/agrifish/agrifishconnect/api/orderlist.php", {
        method: "POST",
        body: form,
        credentials: "include"
      });
      const result = await res.json();

      if (result.success) {
        allOrders = allOrders.filter(o => (o.order_id ?? o.id) !== id);
        renderOrders(allOrders);
        alert("✅ Order deleted successfully");
      } else {
        alert(result.message || "Failed to delete order");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error deleting order");
    }
  }

  // --- Edit order ---
  async function editOrder(id) {
    const order = allOrders.find(o => (o.order_id ?? o.id) === id);
    if (!order) return alert("Order not found");

    const newQty = parseFloat(prompt("Enter new quantity (kg):", order.quantity));
    if (isNaN(newQty) || newQty <= 0) return;

    const form = new FormData();
    form.append("action", "update");
    form.append("id", id);
    form.append("quantity", newQty);

    try {
      const res = await fetch("http://localhost/agrifish/agrifishconnect/api/orderlist.php", {
        method: "POST",
        body: form,
        credentials: "include"
      });
      const result = await res.json();

      if (result.success) {
        order.quantity = newQty;
        order.total_amount = Number(order.product_price || 0) * newQty;
        renderOrders(allOrders);
        alert("✅ Order updated successfully");
      } else {
        alert(result.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error updating order");
    }
  }

  // --- Create order ---
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", async e => {
      e.preventDefault();

      const productId = document.getElementById("productSelect").value;
      const qty = parseFloat(document.getElementById("quantity").value);
      if (!productId || qty <= 0) return alert("Please select a product and valid quantity.");

      const form = new FormData();
      form.append("action", "create");
      form.append("product_id", productId);
      form.append("quantity", qty);

      // ✅ Backend will auto-fill customer info from session
      try {
        const res = await fetch("http://localhost/agrifish/agrifishconnect/api/orderlist.php", {
          method: "POST",
          body: form,
          credentials: "include"
        });
        const result = await res.json();

        if (result.success) {
          await fetchOrders();
          orderForm.reset();
          alert("✅ Order placed successfully");
        } else {
          alert(result.message || "Failed to place order");
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ Error placing order");
      }
    });
  }

  // --- Initialize (fetch session first, then orders) ---
  (async () => {
    await fetchSessionUser();
    await fetchOrders();
  })();
});
