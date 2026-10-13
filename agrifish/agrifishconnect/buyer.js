// Load orders and show total cost
function loadOrders() {
  fetch('http://localhost/agrifish/agrifishconnect/api/orders.php')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('orders-container');

      if (!data.success || !data.data || data.data.length === 0) {
        container.innerHTML = '<div class="no-orders">No orders yet</div>';
        return;
      }

      let totalCost = 0;
      let html = `<table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price per Unit</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>`;

      data.data.forEach(order => {
        // Get unit price from product_price or calculate from total_amount / quantity
        let unitPrice = 0;
        if (order.product_price !== undefined) {
          unitPrice = Number(order.product_price);
        } else if (order.total_amount !== undefined && order.quantity) {
          unitPrice = Number(order.total_amount) / Number(order.quantity);
        }

        // Get total amount
        let total = 0;
        if (order.total_amount !== undefined) {
          total = Number(order.total_amount);
        } else if (order.product_price !== undefined && order.quantity) {
          total = unitPrice * Number(order.quantity);
        }

        totalCost += total;

        html += `<tr>
                   <td>${order.product_name}</td>
                   <td>${order.quantity}</td>
                   <td>₱${unitPrice.toFixed(2)}</td>
                   <td>₱${total.toFixed(2)}</td>
                   <td>${new Date(order.order_date).toLocaleString()}</td>
                   <td>
                     <button class="remove-btn" onclick="removeOrder(${order.id})">Remove</button>
                   </td>
                 </tr>`;
      });

      // Total cost row
      html += `<tr>
                 <td colspan="3" style="text-align: right; font-weight: bold;">Total Cost:</td>
                 <td colspan="3" style="font-weight: bold;">₱${totalCost.toFixed(2)}</td>
               </tr>`;

      html += '</tbody></table>';
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<div class="no-orders">Failed to load orders</div>';
    });
}

// Remove order using POST + FormData
function removeOrder(orderId) {
  if (!confirm("Are you sure you want to remove this order?")) return;

  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('id', orderId);

  fetch('http://localhost/agrifish/agrifishconnect/api/orders.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Order removed successfully!");
      loadOrders(); // reload table after deletion
    } else {
      alert(data.message || "Failed to remove order.");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error deleting order.");
  });
}

// Load orders when page is ready
document.addEventListener('DOMContentLoaded', loadOrders);
