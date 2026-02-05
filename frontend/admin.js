const table = document.getElementById("ordersTable");

const totalOrdersEl = document.getElementById("totalOrders");
const totalRevenueEl = document.getElementById("totalRevenue");
const totalCustomersEl = document.getElementById("totalCustomers");

async function loadOrders(fullDetails = false) {
  try {
    const res = await fetch("https://restaurant-ordering-system-lfub.onrender.com/api/orders");
    const orders = await res.json();

    const table = document.getElementById("ordersTable");
    table.innerHTML = "";

    let totalRevenue = 0;
    const customersSet = new Set();

    orders.forEach(order => {

      totalRevenue += order.totalAmount || 0;
      if (order.user?.email) customersSet.add(order.user.email);

      // ✅ CREATE ROW
      const row = document.createElement("tr");

      // ✅ CLICKABLE ROW
      row.style.cursor = "pointer";
      row.onclick = () => openOrderModal(order._id);

      if (fullDetails) {

        row.innerHTML = `
          <td>${order.user?.name || "Guest"}</td>
          <td>${order.user?.email || ""}</td>
          <td>${order.address?.address || "N/A"}</td>
          <td>
            <ul>
              ${order.items.map(item =>
                `<li>${item.name} x${item.qty} — ₹${item.price}</li>`
              ).join("")}
            </ul>
          </td>
          <td class="payment-badge">${order.paymentMethod}</td>

          <td>₹${order.totalAmount}</td>
          <td>
            <select 
              class="status-select ${order.status.toLowerCase()}"
              onclick="event.stopPropagation()"  
              onchange="updateStatus('${order._id}', this.value)">
              
              <option value="PLACED" ${order.status==="PLACED"?"selected":""}>PLACED</option>
              <option value="PREPARING" ${order.status==="PREPARING"?"selected":""}>PREPARING</option>
              <option value="DELIVERED" ${order.status==="DELIVERED"?"selected":""}>DELIVERED</option>

            </select>
          </td>
        `;

      } else {

        row.innerHTML = `
          <td>${order.user?.name || "Guest"}</td>
          <td>${order.items.length}</td>
          <td class="payment-badge">${order.paymentMethod}</td>

          <td>₹${order.totalAmount}</td>
          <td>
            <select 
              class="status-select ${order.status.toLowerCase()}"
              onclick="event.stopPropagation()"
              onchange="updateStatus('${order._id}', this.value)">
              
              <option value="PLACED" ${order.status==="PLACED"?"selected":""}>PLACED</option>
              <option value="PREPARING" ${order.status==="PREPARING"?"selected":""}>PREPARING</option>
              <option value="DELIVERED" ${order.status==="DELIVERED"?"selected":""}>DELIVERED</option>

            </select>
          </td>
          <td>
            <button class="delete-btn" onclick="deleteOrder('${order._id}')">
              🗑 Delete
            </button>
          </td>

        `;

      }

      table.appendChild(row);
    });

    // ✅ UPDATE STATS
    if (!fullDetails) {
      document.getElementById("totalOrders").innerText = orders.length;
      document.getElementById("totalRevenue").innerText =
        `₹${totalRevenue.toLocaleString("en-IN")}`;
      document.getElementById("totalCustomers").innerText =
        customersSet.size;
    }

  } catch (err) {
    console.error(err);
    document.getElementById("ordersTable").innerHTML =
      "<tr><td colspan='7'>⚠️ Failed to load orders</td></tr>";
  }
}


function showDashboard() {
  document.getElementById("pageTitle").innerText = "Admin Dashboard";
  document.getElementById("contentArea").innerHTML = `
    <section class="stats">
      <div class="card"><h3>Total Orders</h3><p id="totalOrders">0</p></div>
      <div class="card"><h3>Total Revenue</h3><p id="totalRevenue">₹0</p></div>
      <div class="card"><h3>Customers</h3><p id="totalCustomers">0</p></div>
    </section>
    <section class="table-section">
      <h2>Recent Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody id="ordersTable"></tbody>
      </table>
    </section>
  `;
  loadOrders(); // reload stats + table
}

function showOrders() {
  document.getElementById("pageTitle").innerText = "All Orders";
  document.getElementById("contentArea").innerHTML = `
    <section class="table-section">
      <h2>Orders List</h2>
      <table>
        <thead>
          <tr>
            <th>Customer</th><th>Email</th><th>Address</th>
            <th>Items</th><th>Payment</th><th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody id="ordersTable"></tbody>
      </table>
    </section>
  `;
  loadOrders(true); // full details + inline status updates
}

async function updateStatus(id, status) {
  await fetch(`https://restaurant-ordering-system-lfub.onrender.com/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  // reload correct view
  const isOrdersPage = document.getElementById("pageTitle").innerText === "All Orders";
  loadOrders(isOrdersPage);
}


showDashboard();

async function showCustomers() {
  document.getElementById("pageTitle").innerText = "Customers";

  document.getElementById("contentArea").innerHTML = `
    <section class="table-section">
      <h2>Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Total Orders</th>
            <th>Total Spent</th>
            <th>Last Order</th>
          </tr>
        </thead>
        <tbody id="customersTable"></tbody>
      </table>
    </section>
  `;

  try {
    const res = await fetch("https://restaurant-ordering-system-lfub.onrender.com/api/customers");
    if (!res.ok) throw new Error("Failed to fetch customers");
    const customers = await res.json();

    const table = document.getElementById("customersTable");
    table.innerHTML = "";

  customers.forEach(c => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${c.name || "Guest"}</td>
    <td>${c.email}</td>
    <td>${c.totalOrders}</td>
    <td class="${c.totalSpent > 500 ? 'vip' : ''}">₹${c.totalSpent}</td>
    <td>${c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : "N/A"}</td>
  `;

  // 🔥 CLICK → OPEN MODAL
  row.style.cursor = "pointer";
  row.onclick = () => openCustomerModal(c.email, c.name);

  table.appendChild(row);
});


  } catch (err) {
    console.error(err);
    document.getElementById("customersTable").innerHTML =
      "<tr><td colspan='5'>⚠️ Failed to load customers</td></tr>";
  }
}
async function openCustomerModal(email, name) {
  document.getElementById("customerTitle").innerText =
    `Orders by ${name || email}`;

  const container = document.getElementById("customerOrders");
  container.innerHTML = "Loading orders...";

  document.getElementById("customerModal").classList.add("show");

  try {
    const res = await fetch(
      `https://restaurant-ordering-system-lfub.onrender.com/api/orders/customer/${email}`
    );
    const orders = await res.json();

    container.innerHTML = "";

    if (orders.length === 0) {
      container.innerHTML = "<p>No orders found</p>";
      return;
    }

    orders.forEach(order => {
      const div = document.createElement("div");
      div.className = "order-card";

      div.innerHTML = `
        <div class="order-header">
          <span>Order #${order._id.slice(-6)}</span>
          <span>${new Date(order.createdAt).toLocaleString()}</span>
        </div>

        <ul class="order-items">
          ${order.items.map(i =>
            `<li>${i.name} × ${i.qty} — ₹${i.price}</li>`
          ).join("")}
        </ul>

        <p><b>Total:</b> ₹${order.totalAmount}</p>
        <p><b>Payment:</b> ${order.paymentMethod}</p>
        <p><b>Status:</b> ${order.status}</p>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "⚠️ Failed to load orders";
  }
}

function closeCustomerModal() {
  document.getElementById("customerModal").classList.remove("show");
}

function closeOrderModal() {
  document.getElementById("orderDetailsModal").classList.remove("show");
}

async function openOrderModal(orderId) {

  document.getElementById("orderDetailsModal").classList.add("show");

  const content = document.getElementById("orderDetailsContent");
  content.innerHTML = "Loading...";

  try {

    const res = await fetch(`https://restaurant-ordering-system-lfub.onrender.com/api/orders/${orderId}`);
    const order = await res.json();

    content.innerHTML = `
      <p><strong>Customer:</strong> ${order.user?.name}</p>
      <p><strong>Email:</strong> ${order.user?.email}</p>

      <p><strong>Phone:</strong> ${order.address?.phone || "N/A"}</p>
      <p><strong>Address:</strong> ${order.address?.address || "N/A"}</p>

      <hr>

      <h3>Items</h3>
      <ul>
        ${order.items.map(i => `
          <li>${i.name} × ${i.qty} — ₹${i.price}</li>
        `).join("")}
      </ul>

      <hr>

      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    `;

  } catch (err) {
    content.innerHTML = "⚠️ Failed to load order";
  }
}
async function deleteOrder(id) {

  const confirmDelete = confirm("Delete this order permanently?");

  if (!confirmDelete) return;

  await fetch(`https://restaurant-ordering-system-lfub.onrender.com/api/orders/${id}`, {
    method: "DELETE"
  });

  loadOrders();
}
async function showMenu() {
  document.getElementById("pageTitle").innerText = "Menu Preview";

  document.getElementById("contentArea").innerHTML = `
    <section class="table-section">
      <h2>Restaurant Menu</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody id="menuTable"></tbody>
      </table>
    </section>
  `;

  loadStaticMenu();
}


function openMenuModal() {
  document.getElementById("menuModal").classList.add("show");
}

async function loadStaticMenu() {
  try {

    const res = await fetch("menuData.json");
    const data = await res.json();

    const table = document.getElementById("menuTable");
    table.innerHTML = "";

    const menu = data.menu;

    const allItems = [
      ...menu.appetizers,
      ...menu.main_courses,
      ...menu.desserts
    ];

    allItems.forEach(item => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>₹${item.price}</td>
        <td>${item.tags.join(", ")}</td>
      `;

      table.appendChild(row);

    });

  } catch (err) {
    console.error(err);
    document.getElementById("menuTable").innerHTML =
      "<tr><td colspan='4'>⚠️ Failed to load menu</td></tr>";
  }
}

function openLogoutModal() {
  document.getElementById("logoutModal").classList.add("show");
}

function closeLogoutModal() {
  document.getElementById("logoutModal").classList.remove("show");
}

function confirmLogout() {
  localStorage.clear();
  window.location.href = "index.html";
}
