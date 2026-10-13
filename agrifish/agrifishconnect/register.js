document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    // Collect form data
    const formData = {
        firstname: document.querySelector('[name="firstname"]').value.trim(),
        middlename: document.querySelector('[name="middlename"]').value.trim(),
        lastname: document.querySelector('[name="lastname"]').value.trim(),
        contact: document.querySelector('[name="contact"]').value.trim(),
        address: document.querySelector('[name="address"]').value.trim(),
        email: document.querySelector('[name="email"]').value.trim(),
        password: document.querySelector('[name="password"]').value.trim(),
        user_type: document.getElementById('user_type').value // 'admin' or 'customer'
    };

    if (!formData.user_type) {
        alert("Please select a user type.");
        return;
    }

    try {
        const response = await fetch('http://localhost/agrifish/agrifishconnect/api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            credentials: 'same-origin' // ensures session cookie is set
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);

            // Redirect automatically based on PHP response
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                console.log("No redirect URL provided. Stay on page.");
            }

        } else {
            alert(data.message || "Registration failed.");
        }

    } catch (err) {
        console.error("Registration error:", err);
        alert("Network or server error. See console for details.");
    }
});
