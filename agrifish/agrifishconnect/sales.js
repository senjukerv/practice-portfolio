document.addEventListener("DOMContentLoaded", () => {
  const btnSales = document.getElementById("btnSales");
  const salesPopup = document.getElementById("salesPopup");
  const closeSales = document.getElementById("closeSales");

  // Open popup and fetch data
  btnSales.addEventListener("click", async () => {
    salesPopup.style.display = "block";

    try {
      const res = await fetch("http://localhost/agrifish/agrifishconnect/api/salessummary.php", {
        credentials: "include"
      });
      const data = await res.json();

      if (!data.success) return alert(data.message || "Failed to load sales");

      // Populate daily
      const dailyTbody = document.querySelector("#dailySalesTable tbody");
      dailyTbody.innerHTML = "";
      data.daily.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.day}</td><td>₱${Number(row.total).toFixed(2)}</td>`;
        dailyTbody.appendChild(tr);
      });

      // Populate monthly
      const monthlyTbody = document.querySelector("#monthlySalesTable tbody");
      monthlyTbody.innerHTML = "";
      data.monthly.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.year}</td><td>${row.month}</td><td>₱${Number(row.total).toFixed(2)}</td>`;
        monthlyTbody.appendChild(tr);
      });

      // Populate yearly
      const yearlyTbody = document.querySelector("#yearlySalesTable tbody");
      yearlyTbody.innerHTML = "";
      data.yearly.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.year}</td><td>₱${Number(row.total).toFixed(2)}</td>`;
        yearlyTbody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
      alert("Error loading sales data");
    }
  });

  // Close popup
  closeSales.addEventListener("click", () => { salesPopup.style.display = "none"; });

  // Click outside to close
  window.addEventListener("click", e => { if(e.target === salesPopup) salesPopup.style.display = "none"; });

  // Tabs logic
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // Activate clicked
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.target);
      target.classList.add("active");
    });
  });
});
