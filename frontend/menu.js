// ================= AUTH =================
const user = JSON.parse(localStorage.getItem("user"));
if (!user) window.location.href = "index.html";

// ================= GLOBAL STATE =================
let fullMenu = {};
let activeFilter = "all";
let cart = {};

// ================= FETCH MENU =================
fetch("menuData.json")
  .then(res => res.json())
  .then(data => {
    fullMenu = data.menu;
    renderAll();
  })
  .catch(err => {
    console.error(err);
    alert("Menu load failed");
  });

// ================= FILTER =================
function applyFilter(type) {
  activeFilter = type;

  document
    .querySelectorAll(".filters button")
    .forEach(btn => btn.classList.remove("active"));

  event.target.classList.add("active");

  renderAll();
}

function filterItems(items) {
  if (activeFilter === "all") return items;
  return items.filter(item => item.tags.includes(activeFilter));
}

// ================= RENDER MENU =================
function renderAll() {
  document.getElementById("appetizers").innerHTML = "";
  document.getElementById("main_courses").innerHTML = "";
  document.getElementById("desserts").innerHTML = "";

  renderMenu(filterItems(fullMenu.appetizers), "appetizers");
  renderMenu(filterItems(fullMenu.main_courses), "main_courses");
  renderMenu(filterItems(fullMenu.desserts), "desserts");
}

function renderMenu(items, containerId) {
  const container = document.getElementById(containerId);

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "food-card";

    card.innerHTML = `
      <img src="img/${item.id}.jpg" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="tags">
        ${item.tags.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
      <div class="price">₹${item.price}</div>
      <button onclick="addToCart('${item.id}')">Add</button>
    `;

    container.appendChild(card);
  });
}

// ================= CART =================
function addToCart(id) {
  const allItems = [
    ...fullMenu.appetizers,
    ...fullMenu.main_courses,
    ...fullMenu.desserts
  ];

  const item = allItems.find(i => i.id === id);
  if (!item) return;

  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = {
      name: item.name,
      price: item.price,
      qty: 1
    };
  }

  // 👇 SHOW CART ON FIRST ADD
  document.querySelector(".cart").classList.add("show");

  renderCart();
}


function renderCart() {
  const cartDiv = document.getElementById("cart-items");
  const totalDiv = document.getElementById("cart-total");
  const cartBox = document.querySelector(".cart");

  cartDiv.innerHTML = "";
  let total = 0;

  const items = Object.entries(cart);

  // 🧠 If cart empty → hide cart
  if (items.length === 0) {
    cartBox.classList.remove("show");
    totalDiv.innerText = "0";
    return;
  }

  items.forEach(([id, item]) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    cartDiv.innerHTML += `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div class="qty-controls">
            <button onclick="decreaseQty('${id}')">−</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty('${id}')">+</button>
          </div>
        </div>
        <span>₹${itemTotal.toFixed(2)}</span>
      </div>
    `;
  });

  totalDiv.innerText = total.toFixed(2);
}
function increaseQty(id) {
  cart[id].qty += 1;
  renderCart();
}

function decreaseQty(id) {
  cart[id].qty -= 1;

  // ❌ Remove item if qty = 0
  if (cart[id].qty === 0) {
    delete cart[id];
  }

  renderCart();
}


// ================= CHECKOUT =================
function checkout() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty");
    return;
  }

  document.getElementById("addressModal").classList.add("show");
}

function closeAddressModal() {
  document.getElementById("addressModal").classList.remove("show");
}

function saveAddress() {
  const name = document.getElementById("addrName").value;
  const phone = document.getElementById("addrPhone").value;
  const address = document.getElementById("addrText").value;

  if (!name || !phone || !address) {
    alert("Please fill all address details");
    return;
  }

  localStorage.setItem("address", JSON.stringify({ name, phone, address }));

  closeAddressModal();
  openPaymentModal();
}
function openPaymentModal() {
  document.getElementById("paymentModal").classList.add("show");

  // Default: COD selected
  selectPayment("cod");
}


function closePaymentModal() {
  document.getElementById("paymentModal").classList.remove("show");
}

/* SHOW / HIDE UPI INPUT */
document.addEventListener("change", e => {
  if (e.target.name === "payment") {
    document.getElementById("upiId").style.display =
      document.getElementById("upi").checked ? "block" : "none";
  }
});

/* FINAL ORDER */
async function placeOrder() {
  const paymentMethod = document.getElementById("upi").checked ? "UPI" : "COD";
  const upiId = document.getElementById("upiId").value;

  if (paymentMethod === "UPI" && !upiId) {
    alert("Please enter UPI ID");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const address = JSON.parse(localStorage.getItem("address"));

  // convert cart object → array
  const items = Object.keys(cart).map(id => ({
    itemId: id,
    name: cart[id].name,
    price: cart[id].price,
    qty: cart[id].qty
  }));

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const order = {
    user: {
      name: user.name,
      email: user.email
    },
    items,
    totalAmount,
    address,
    paymentMethod,
    upiId: paymentMethod === "UPI" ? upiId : null
  };

  try {
    const res = await fetch("https://restaurant-ordering-system-lfub.onrender.com/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    if (!res.ok) {
      throw new Error("Order failed");
    }

    const data = await res.json();
    console.log("✅ ORDER SAVED:", data);

    // 🧹 CLEAR CART
    cart = {};
    renderCart();
    localStorage.removeItem("address");

    closePaymentModal();

    // 🎉 SUCCESS
    document.getElementById("successModal").classList.add("show");
    confettiBurst();

  } catch (err) {
    console.error(err);
    alert("❌ Order failed. Backend not responding.");
  }
}

function confettiBurst() {
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.background =
      ["#f4b400", "#4caf50", "#ff6b6b"][Math.floor(Math.random() * 3)];
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 1200);
  }
}


function selectPayment(type) {
  selectedPayment = type;

  // radio sync
  document.getElementById("cod").checked = type === "cod";
  document.getElementById("upi").checked = type === "upi";

  // UI highlight
  document
    .querySelectorAll(".payment-option")
    .forEach(opt => opt.classList.remove("active"));

  event.currentTarget.classList.add("active");

  // show/hide UPI input
  document.getElementById("upiId").style.display =
    type === "upi" ? "block" : "none";
}

function closeSuccess() {
  document.getElementById("successModal").classList.remove("show");
}
function searchMenu() {
  const query = document
    .getElementById("searchInput")
    .value
    .toLowerCase();

  document.getElementById("appetizers").innerHTML = "";
  document.getElementById("main_courses").innerHTML = "";
  document.getElementById("desserts").innerHTML = "";

  const match = item =>
    item.name.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query);

  renderMenu(
    filterItems(fullMenu.appetizers).filter(match),
    "appetizers"
  );
  renderMenu(
    filterItems(fullMenu.main_courses).filter(match),
    "main_courses"
  );
  renderMenu(
    filterItems(fullMenu.desserts).filter(match),
    "desserts"
  );
}


