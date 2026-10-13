let products = [];

// Fetch products from API
async function fetchProducts() {
    try {
        const res = await fetch("http://localhost/agrifish/agrifishconnect/api/products.php");
        const data = await res.json();

        if (data.success) {
            products = data.data;
            renderProducts();
        } else {
            console.error(data);
            alert("❌ Failed to fetch products from API");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("❌ Server not responding. Check API path.");
    }
}


// Render products
function renderProducts() {
    const container = document.getElementById("card-grid");
    container.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";

        // Check if product.image already includes folder path
        let imageSrc = product.image || ""; 
        if (!imageSrc.startsWith("http") && !imageSrc.startsWith("/")) {
            imageSrc = `http://localhost/agrifish/agrifishconnect/${imageSrc}`;
        }

        // Fallback if image is missing
        if (!imageSrc) {
            imageSrc = "https://via.placeholder.com/300x180?text=No+Image";
        }

        card.innerHTML = `
            <img src="${imageSrc}" alt="${product.name}" class="card-img"
                 onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            <div class="card-content">
                <h2 class="card-title">${product.name}</h2>
                <div class="card-details">
                    <span>Quantity: <strong>${product.quantity} kg</strong></span>
                    <span class="price">₱${Number(product.price).toFixed(2)}</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Load products on page start
document.addEventListener("DOMContentLoaded", fetchProducts);
