document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value.trim()
    };

    if (!formData.email || !formData.password) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await fetch("http://localhost/agrifish/agrifishconnect/api/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
            credentials: "include" // ✅ THIS ENSURES PHP SESSION IS SAVED
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            window.location.href = data.redirect;
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Network or server error.");
    }
});
