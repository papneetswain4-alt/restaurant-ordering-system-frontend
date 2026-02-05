/* ================= GOOGLE LOGIN ================= */

function handleCredentialResponse(response) {
  try {

    // ✅ FIX → Proper base64url decode (Google JWT fix)
    const base64Url = response.credential.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: "customer"
    };

    // Save Customer
    localStorage.setItem("user", JSON.stringify(user));

    // Remove Admin (Safety)
    localStorage.removeItem("admin");

    // Close Modal
    closeCustomerLogin();

    // Redirect
    window.location.href = "menu.html";

  } catch (error) {
    console.error("Google login failed", error);
    alert("Login failed. Try again.");
  }
}

// Make global for Google SDK
window.handleCredentialResponse = handleCredentialResponse;


/* ================= MODAL CONTROLS ================= */

function openCustomerLogin() {
  document.getElementById("customerLoginModal").classList.add("show");
}

function closeCustomerLogin() {
  document.getElementById("customerLoginModal").classList.remove("show");
}

function openAdminLogin() {
  document.getElementById("adminLoginModal").classList.add("show");
}

function closeAdminLogin() {
  document.getElementById("adminLoginModal").classList.remove("show");
}


/* ================= ADMIN LOGIN ================= */

async function adminLogin() {

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    alert("Enter admin email & password");
    return;
  }

  try {

    const res = await fetch(
      "https://restaurant-ordering-system-lfub.onrender.com/api/admin/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Admin login failed");
      return;
    }

    // Save Admin
    localStorage.setItem("admin", JSON.stringify(data.admin));

    // Optional → Save token if backend sends it
    if (data.token) {
      localStorage.setItem("adminToken", data.token);
    }

    // Remove Customer
    localStorage.removeItem("user");

    // Close Modal
    closeAdminLogin();

    // Redirect
    window.location.href = "admin.html";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}
