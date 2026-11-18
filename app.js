const navItems = [
  ["01", "Home", "index.html"], ["02", "Coffee & Menu Shop", "shop.html"],
  ["03", "About", "about.html", [
    ["04", "Company Profile", "profile.html"], ["05", "Org Chart", "org-chart.html"], ["06", "History", "history.html"]
  ]],
  ["07", "Table Reservation", "reservation.html"], ["08", "Services & Catering", "services.html"],
  ["09", "Contact", "contact.html"], ["10", "FAQ", "faq.html"], ["11", "Portfolio", "portfolio.html"],
  ["12", "Featured Blends", "shop.html#featured"], ["13", "Checkout", "checkout.html"], ["14", "Payment", "payment.html"], ["15", "My Orders", "orders.html"]
];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const getCart = () => JSON.parse(localStorage.getItem("goodkind-cart") || "[]");
const setCart = cart => { localStorage.setItem("goodkind-cart", JSON.stringify(cart)); updateBagCount(); };
const getOrders = () => JSON.parse(localStorage.getItem("goodkind-orders") || "[]");
const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);
const currentPage = location.pathname.split("/").pop() || "index.html";
const app = document.querySelector("#app");

function navLink(number, label, href, active) {
  return `<li><a class="nav-link${active ? " active" : ""}" href="${href}"><span class="nav-number">${number}</span><span>${label}</span></a></li>`;
}

function renderFrame(content) {
  const nav = navItems.map(([number, label, href, children]) => {
    if (!children) return navLink(number, label, href, currentPage === href.split("#")[0]);
    const expanded = currentPage === "about.html" || children.some(item => item[2] === currentPage);
    return `<li><button class="nav-parent${expanded ? " active" : ""}" aria-expanded="${expanded}" aria-controls="about-subnav"><span class="nav-number">${number}</span><span>${label}</span><span class="nav-chevron">›</span></button><ul class="subnav" id="about-subnav" ${expanded ? "" : "hidden"}>${navLink("", "Overview", href, currentPage === href)}${children.map(item => navLink(...item, currentPage === item[2])).join("")}</ul></li>`;
  }).join("");

  app.innerHTML = `
    <header class="site-header">
      <button class="menu-toggle" aria-label="Open navigation menu" aria-expanded="false"><span class="menu-icon"></span></button>
      <a class="brand" href="index.html"><span class="brand-mark">A</span><span><span class="brand-name">Ashleyloyleyy</span><span class="brand-tag">COFFEE HOUSE · ROASTED DAILY</span></span></a>
      <div class="cafe-status"><strong>● OPEN TODAY · 7AM—5PM</strong>DINE-IN & PICKUP</div>
      <a class="bag-link" href="checkout.html">YOUR BAG <span class="bag-count">0</span> →</a>
    </header>
    <div class="mobile-overlay"></div>
    <div class="site-layout">
      <nav class="site-nav" aria-label="Main navigation"><p class="nav-caption">A little good, every day</p><ul class="nav-list">${nav}</ul></nav>
      <main class="site-content">${content}</main>
      <aside class="site-aside"><p class="aside-title">A few things we believe</p><ul class="ethos-list"><li><span>01</span>Thoughtfully sourced beans</li><li><span>02</span>Small-batch, always fresh</li><li><span>03</span>Room for everyone here</li></ul><div class="aside-card"><p>Your table is waiting.</p><a href="reservation.html">Find your seat →</a></div></aside>
      <footer class="site-footer"><span>© 2026 Ashleyloyleyy · Made with care, shared with you.</span><span class="footer-links"><a href="shop.html">Coffee & menu</a><a href="reservation.html">Reservations</a><a href="contact.html">Find us</a></span></footer>
    </div><div class="toast" role="status" aria-live="polite"></div>`;
  hydratePage();
  bindFrame();
}

function renderCurrentPage() {
  const template = document.querySelector("#page-content");
  if (!template) throw new Error(`Missing page content template in ${currentPage}.`);
  renderFrame(template.innerHTML);
}

function hydratePage() {
  if (currentPage === "checkout.html") hydrateCheckout();
  if (currentPage === "payment.html") hydratePayment();
  if (currentPage === "orders.html") hydrateOrders();
}

function hydrateCheckout() {
  const cart = getCart();
  const cartPanel = document.querySelector("#cart-panel");
  const checkoutPanel = document.querySelector("#checkout-panel");
  const emptyState = document.querySelector("#checkout-empty");
  if (!cartPanel || !checkoutPanel || !emptyState) return;

  emptyState.hidden = cart.length > 0;
  cartPanel.hidden = cart.length === 0;
  checkoutPanel.hidden = cart.length === 0;
  if (!cart.length) return;

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tableSelect = document.querySelector("#order-table");
  if (tableSelect) {
    const reservations = getOrders().filter(order => order.kind === "reservation");
    tableSelect.innerHTML = `<option value="">No table reservation</option>${reservations.map(order => `<option value="${escapeHtml(order.table)}">${escapeHtml(order.table)} · ${escapeHtml(order.date)} · ${escapeHtml(order.time)}</option>`).join("")}`;
  }
  document.querySelector("#cart-list").innerHTML = cart.map(item => `
    <article class="cart-item">
      <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${currency.format(item.price)} each</p></div>
      <div class="quantity-control">
        <button type="button" aria-label="Decrease ${escapeHtml(item.name)}" data-quantity="-1" data-id="${escapeHtml(item.id)}">−</button>
        <span>${item.quantity}</span>
        <button type="button" aria-label="Increase ${escapeHtml(item.name)}" data-quantity="1" data-id="${escapeHtml(item.id)}">+</button>
      </div>
      <button class="remove-item" type="button" data-remove="${escapeHtml(item.id)}">Remove</button>
    </article>`).join("");
  document.querySelector("#cart-subtotal").textContent = currency.format(subtotal);
  document.querySelector("#checkout-submit").textContent = `Continue to payment · ${currency.format(subtotal)}`;
}

function hydratePayment() {
  const cart = getCart();
  const emptyState = document.querySelector("#payment-empty");
  const summary = document.querySelector("#payment-summary");
  const form = document.querySelector("#payment-form");
  if (!emptyState || !summary || !form) return;

  emptyState.hidden = cart.length > 0;
  summary.hidden = cart.length === 0;
  form.hidden = cart.length === 0;
  if (!cart.length) return;

  const draft = JSON.parse(sessionStorage.getItem("goodkind-checkout") || "{}");
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (draft.fulfillment === "Local delivery" ? 4 : 0);
  document.querySelector("#payment-order-summary").textContent = `${itemCount} lovely thing(s) · ${draft.fulfillment || "Store pickup"} · ${currency.format(total)}`;
  document.querySelector("#payment-submit").textContent = `Place demo order · ${currency.format(total)}`;
}

function hydrateOrders() {
  const orders = getOrders();
  const purchases = orders.filter(order => order.kind === "purchase");
  const reservations = orders.filter(order => order.kind === "reservation");
  document.querySelector('[data-order-count="purchase"]').textContent = purchases.length;
  document.querySelector('[data-order-count="reservation"]').textContent = reservations.length;
  document.querySelector("#order-list").innerHTML = renderOrderList(purchases, "purchase");
}

function renderOrderList(orders, kind) {
  if (!orders.length) return `<section class="empty-state"><h2>No ${kind === "purchase" ? "orders" : "reservations"} just yet.</h2><p>${kind === "purchase" ? "Your next favorite is waiting at the cafe." : "A good seat and a good cup are just a few clicks away."}</p><a class="button" href="${kind === "purchase" ? "shop.html" : "reservation.html"}">${kind === "purchase" ? "Browse the menu" : "Reserve a table"}</a></section>`;
  return orders.map(order => {
    const reservation = order.kind === "reservation";
    const heading = reservation
      ? `Table ${escapeHtml(order.table)} · ${order.guests === "2" ? "2 guests" : order.guests === "3-4" ? "3–4 guests" : "5+ guests"}`
      : `Ashleyloyleyy order ${escapeHtml(order.id)}`;
    const details = reservation
      ? `${escapeHtml(order.date)} · ${escapeHtml(order.time)}${order.name ? ` · ${escapeHtml(order.name)}` : ""}`
      : `${escapeHtml(order.date)} · ${escapeHtml(order.fulfillment)} · ${escapeHtml(order.email || "")}`;
    const status = reservation ? "Confirmed" : escapeHtml(order.status || "Received");

    return `<article class="order-card">
      <div class="order-card-header"><div><h2>${heading}</h2><p>${details}</p></div><span class="order-status">${status}</span></div>
      ${reservation
        ? `<p style="margin-top:12px">${escapeHtml(order.notes || "We can’t wait to see you.")}${order.outlet ? " · Power outlet requested" : ""}</p>`
        : `<div class="order-lines"><span>${order.items.map(item => `${escapeHtml(item.quantity)} × ${escapeHtml(item.name)}`).join(" · ")}</span><strong>${currency.format(order.total)}</strong></div><div class="order-steps"><span class="done"></span><span class="${order.status === "Preparing" || order.status === "Ready" ? "done" : ""}"></span><span class="${order.status === "Ready" ? "done" : ""}"></span></div>`}
    </article>`;
  }).join("");
}

function updateBagCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll(".bag-count").forEach(element => { element.textContent = count; });
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function bindFrame() {
  updateBagCount();
  const status = document.querySelector(".cafe-status strong");
  const isOpen = new Date().getHours() >= 7 && new Date().getHours() < 17;
  status.textContent = isOpen ? "● OPEN NOW · UNTIL 5PM" : "● CLOSED NOW · OPENS AT 7AM";

  const menuToggle = document.querySelector(".menu-toggle");
  const closeMenu = () => { document.body.classList.remove("nav-open"); menuToggle.setAttribute("aria-expanded", "false"); };
  menuToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  document.querySelector(".mobile-overlay").addEventListener("click", closeMenu);
  document.querySelectorAll(".site-nav a").forEach(link => link.addEventListener("click", closeMenu));
  const parent = document.querySelector(".nav-parent");
  parent.addEventListener("click", () => {
    const expanded = parent.getAttribute("aria-expanded") === "true";
    parent.setAttribute("aria-expanded", String(!expanded));
    document.querySelector("#about-subnav").hidden = expanded;
  });

  document.querySelectorAll(".add-to-bag").forEach(button => button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    const product = {
      id: button.dataset.product,
      name: card.dataset.name,
      category: card.dataset.category,
      price: Number(card.dataset.price)
    };
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    setCart(cart);
    showToast(`${product.name} added to your bag.`);
  }));
  document.querySelectorAll(".filter-button[data-filter]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".filter-button[data-filter]").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".product-card").forEach(card => { card.hidden = button.dataset.filter !== "All" && card.dataset.category !== button.dataset.filter; });
  }));
  document.querySelectorAll("[data-quantity]").forEach(button => button.addEventListener("click", () => {
    const cart = getCart();
    const item = cart.find(entry => entry.id === button.dataset.id);
    if (item) item.quantity += Number(button.dataset.quantity);
    setCart(cart.filter(entry => entry.quantity > 0));
    renderCurrentPage();
  }));
  document.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    setCart(getCart().filter(item => item.id !== button.dataset.remove));
    renderCurrentPage();
  }));
  bindBooking();
  bindContact();
  bindCheckout();
  bindPayment();
  bindPortfolio();
  bindOrderTabs();
}

function bindBooking() {
  const form = document.querySelector("#booking-form");
  if (!form) return;
  const dateInput = form.querySelector('[name="date"]');
  const today = new Date();
  dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  let selected = "";
  const tableButtons = [...document.querySelectorAll(".table-option")];
  const refreshTables = () => {
    const guests = form.querySelector('[name="guests"]').value;
    const requiredSeats = guests === "2" ? 2 : guests === "3-4" ? 3 : 5;
    tableButtons.forEach(button => {
      const reserved = button.dataset.reserved === "true";
      const fits = Number(button.dataset.seats) >= requiredSeats;
      button.disabled = reserved || !fits;
      button.classList.toggle("unavailable", !reserved && !fits);
      if (!fits && button.dataset.table === selected) {
        button.classList.remove("selected");
        selected = "";
      }
    });
  };
  form.querySelector('[name="guests"]').addEventListener("change", refreshTables);
  tableButtons.filter(button => button.dataset.reserved !== "true").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".table-option").forEach(table => table.classList.remove("selected"));
    button.classList.add("selected");
    selected = button.dataset.table;
  }));
  refreshTables();
  form.addEventListener("submit", event => {
    event.preventDefault();
    const status = form.querySelector(".booking-status");
    if (!selected) { status.textContent = "Choose an available table on the floor plan first."; status.style.color = "#a34f36"; return; }
    const values = new FormData(form);
    const reservation = { kind: "reservation", id: Date.now().toString(36), table: selected, date: values.get("date"), time: values.get("time"), guests: values.get("guests"), name: values.get("name"), notes: values.get("notes"), outlet: values.has("outlet"), dateCreated: new Date().toLocaleDateString() };
    const orders = getOrders();
    orders.unshift(reservation);
    localStorage.setItem("goodkind-orders", JSON.stringify(orders));
    status.style.color = "";
    status.textContent = `You’re all set, ${reservation.name}! Table ${selected} for ${reservation.guests} on ${reservation.date}, ${reservation.time}. See you soon!`;
    showToast("Your table is confirmed.");
  });
}

function bindContact() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    form.querySelector(".form-result").textContent = "Thanks for your note! This demo form is ready to connect to your inbox.";
    form.reset();
  });
}

function bindCheckout() {
  const form = document.querySelector("#checkout-form");
  if (!form) return;
  const updateFields = () => {
    const fulfillment = form.querySelector('[name="fulfillment"]:checked').value;
    form.querySelector("#table-link-field").hidden = fulfillment !== "Dine-in";
    form.querySelector("#address-field").hidden = fulfillment !== "Local delivery";
    form.querySelector("#delivery-address").required = fulfillment === "Local delivery";
  };
  form.querySelectorAll('[name="fulfillment"]').forEach(radio => radio.addEventListener("change", updateFields));
  updateFields();
  form.addEventListener("submit", event => {
    event.preventDefault();
    const values = new FormData(form);
    const fulfillment = values.get("fulfillment");
    const draft = { fulfillment, table: values.get("table"), address: values.get("address") };
    sessionStorage.setItem("goodkind-checkout", JSON.stringify(draft));
    location.href = "payment.html";
  });
}

function bindPayment() {
  const form = document.querySelector("#payment-form");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const values = new FormData(form);
    const cart = getCart();
    if (!cart.length) { location.href = "checkout.html"; return; }
    const draft = JSON.parse(sessionStorage.getItem("goodkind-checkout") || "{}");
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (draft.fulfillment === "Local delivery" ? 4 : 0);
    const order = { kind: "purchase", id: Math.random().toString(36).slice(2, 8).toUpperCase(), date: new Date().toLocaleString(), fulfillment: draft.fulfillment || "Store pickup", address: draft.address, table: draft.table, email: values.get("email"), items: cart.map(({ id, name, quantity, price }) => ({ id, name, quantity, price })), total, status: "Received" };
    const orders = getOrders();
    orders.unshift(order);
    localStorage.setItem("goodkind-orders", JSON.stringify(orders));
    setCart([]);
    sessionStorage.removeItem("goodkind-checkout");
    form.hidden = true;
    document.querySelector("#payment-summary").hidden = true;
    const success = document.querySelector("#payment-success");
    success.hidden = false;
    document.querySelector("#success-order").textContent = `${order.id} · ${order.fulfillment}`;
    document.querySelector("#success-name").textContent = `You’re all set, ${values.get("name")}.`;
  });
}

function bindOrderTabs() {
  const tabs = document.querySelectorAll("[data-order-tab]");
  if (!tabs.length) return;
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(item => item.classList.toggle("active", item === tab));
    const kind = tab.dataset.orderTab === "purchases" ? "purchase" : "reservation";
    document.querySelector("#order-list").innerHTML = renderOrderList(getOrders().filter(order => order.kind === kind), kind);
  }));
}

function bindPortfolio() {
  document.querySelectorAll("[data-portfolio-section]").forEach(section => {
    const cards = [...section.querySelectorAll(".portfolio-card")];
    const previous = section.querySelector(".portfolio-prev");
    const next = section.querySelector(".portfolio-next");
    const status = section.querySelector(".portfolio-page");
    if (!cards.length || !previous || !next || !status) throw new Error("Portfolio sections need cards, previous/next buttons, and a page status.");

    let page = 0;
    const update = () => {
      const pageSize = window.matchMedia("(max-width: 720px)").matches ? 1 : 3;
      const pageCount = Math.ceil(cards.length / pageSize);
      page = Math.min(page, pageCount - 1);
      const firstCard = page * pageSize;
      const lastCard = Math.min(firstCard + pageSize, cards.length);
      cards.forEach((card, index) => { card.hidden = index < firstCard || index >= lastCard; });
      status.textContent = `Showing ${firstCard + 1}–${lastCard} of ${cards.length}`;
      previous.disabled = page === 0;
      next.disabled = page === pageCount - 1;
    };
    previous.addEventListener("click", () => { page -= 1; update(); });
    next.addEventListener("click", () => { page += 1; update(); });
    window.addEventListener("resize", update);
    update();
  });
}

renderCurrentPage();
