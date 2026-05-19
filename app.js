const STORAGE_KEYS = {
  menu: "mdomalds-menu",
  orders: "mdomalds-orders",
};

const DEFAULT_MENU = {
  meals: [
    {
      id: "classic-md-burger",
      name: "Classic M Burger",
      description: "Beef patty, cheddar, pickles, lettuce, and house sauce.",
      price: 5.9,
    },
    {
      id: "crispy-chicken-stack",
      name: "Crispy Chicken Stack",
      description: "Crispy chicken, slaw, tomato, and pepper mayo.",
      price: 6.4,
    },
    {
      id: "double-cheese",
      name: "Double Cheese",
      description: "Two beef patties, double cheddar, onion, and ketchup.",
      price: 6.9,
    },
    {
      id: "veggie-crunch",
      name: "Veggie Crunch",
      description: "Vegetable patty, salad greens, pickles, and herb sauce.",
      price: 5.6,
    },
  ],
  drinks: [
    {
      id: "cola",
      name: "Cola",
      description: "Chilled classic cola.",
      price: 1.9,
    },
    {
      id: "lemon-iced-tea",
      name: "Lemon Iced Tea",
      description: "Cold tea with lemon.",
      price: 2.2,
    },
    {
      id: "orange-soda",
      name: "Orange Soda",
      description: "Bright orange soda.",
      price: 2.1,
    },
    {
      id: "sparkling-water",
      name: "Sparkling Water",
      description: "Light sparkling water.",
      price: 1.6,
    },
  ],
};

const state = {
  quantities: {},
  menu: { meals: [], drinks: [] },
};

const elements = {
  mealsMenu: document.querySelector("#mealsMenu"),
  drinksMenu: document.querySelector("#drinksMenu"),
  orderForm: document.querySelector("#orderForm"),
  summaryList: document.querySelector("#summaryList"),
  summaryEmpty: document.querySelector("#summaryEmpty"),
  summaryTotal: document.querySelector("#summaryTotal"),
  clearSelection: document.querySelector("#clearSelection"),
  queueList: document.querySelector("#queueList"),
  nowServing: document.querySelector("#nowServing"),
  queueCount: document.querySelector("#queueCount"),
  toast: document.querySelector("#toast"),
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeProduct(product, type, index) {
  if (typeof product === "string") {
    return {
      id: `${type}-${slugify(product) || index}`,
      name: product,
      description: type === "meals" ? "Freshly prepared meal." : "Cold drink.",
      price: type === "meals" ? 5.5 : 1.9,
    };
  }

  return {
    id: product.id || `${type}-${slugify(product.name || "item") || index}`,
    name: product.name || "Menu item",
    description: product.description || (type === "meals" ? "Freshly prepared meal." : "Cold drink."),
    price: Number(product.price) > 0 ? Number(product.price) : type === "meals" ? 5.5 : 1.9,
  };
}

function normalizeMenu(menu) {
  return {
    meals: (menu.meals || []).map((product, index) => normalizeProduct(product, "meals", index)),
    drinks: (menu.drinks || []).map((product, index) => normalizeProduct(product, "drinks", index)),
  };
}

function loadMenu() {
  const storedMenu = readJson(STORAGE_KEYS.menu, null) || readJson("menu", null);
  const menu = normalizeMenu(storedMenu || DEFAULT_MENU);
  writeJson(STORAGE_KEYS.menu, menu);
  state.menu = menu;
}

function readOrders() {
  const storedOrders = readJson(STORAGE_KEYS.orders, null) || readJson("orders", []);
  const orders = storedOrders.map((order) => {
    if (Array.isArray(order.items)) {
      return {
        ...order,
        status: order.status || "queued",
      };
    }

    const items = Object.entries(order.orderDetails || {}).map(([name, quantity]) => ({
      id: slugify(name),
      name,
      quantity,
      price: 0,
    }));

    return {
      id: String(order.orderNumber || Date.now()),
      orderNumber: order.orderNumber || Math.floor(Math.random() * 900) + 100,
      items,
      status: "queued",
      createdAt: new Date().toISOString(),
    };
  });

  writeJson(STORAGE_KEYS.orders, orders);
  return orders;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-LT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.setTimeout(() => elements.toast.classList.remove("visible"), 2400);
}

function getAllProducts() {
  return [...state.menu.meals, ...state.menu.drinks];
}

function getProduct(productId) {
  return getAllProducts().find((product) => product.id === productId);
}

function createMenuCard(product) {
  const card = document.createElement("article");
  card.className = "menu-card";

  const header = document.createElement("div");
  header.className = "menu-card-header";

  const text = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  text.append(title, description);

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatMoney(product.price);

  header.append(text, price);

  const controls = document.createElement("div");
  controls.className = "quantity-controls";

  const decrement = document.createElement("button");
  decrement.type = "button";
  decrement.textContent = "-";
  decrement.setAttribute("aria-label", `Remove ${product.name}`);
  decrement.addEventListener("click", () => updateQuantity(product.id, -1));

  const quantity = document.createElement("span");
  quantity.className = "quantity";
  quantity.dataset.productId = product.id;
  quantity.textContent = "0";

  const increment = document.createElement("button");
  increment.type = "button";
  increment.textContent = "+";
  increment.setAttribute("aria-label", `Add ${product.name}`);
  increment.addEventListener("click", () => updateQuantity(product.id, 1));

  controls.append(decrement, quantity, increment);
  card.append(header, controls);
  return card;
}

function renderMenu() {
  elements.mealsMenu.replaceChildren(...state.menu.meals.map(createMenuCard));
  elements.drinksMenu.replaceChildren(...state.menu.drinks.map(createMenuCard));
}

function updateQuantity(productId, amount) {
  const current = state.quantities[productId] || 0;
  const next = Math.max(0, current + amount);
  state.quantities[productId] = next;

  document.querySelectorAll(`[data-product-id="${productId}"]`).forEach((element) => {
    element.textContent = String(next);
  });

  renderSummary();
}

function getSelectedItems() {
  return Object.entries(state.quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => {
      const product = getProduct(productId);
      return product ? { ...product, quantity } : null;
    })
    .filter(Boolean);
}

function renderSummary() {
  const items = getSelectedItems();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  elements.summaryEmpty.hidden = items.length > 0;
  elements.summaryTotal.textContent = formatMoney(total);
  elements.summaryList.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = `${item.quantity}x ${item.name}`;
      const price = document.createElement("strong");
      price.textContent = formatMoney(item.price * item.quantity);
      row.append(label, price);
      return row;
    })
  );
}

function clearSelection() {
  state.quantities = {};
  document.querySelectorAll(".quantity").forEach((element) => {
    element.textContent = "0";
  });
  renderSummary();
}

function placeOrder(event) {
  event.preventDefault();
  const items = getSelectedItems();

  if (items.length === 0) {
    showToast("Choose at least one item first.");
    return;
  }

  const orders = readOrders();
  const orderNumber = Math.floor(Math.random() * 900) + 100;
  orders.push({
    id: `${Date.now()}-${orderNumber}`,
    orderNumber,
    items,
    status: "queued",
    createdAt: new Date().toISOString(),
  });
  writeJson(STORAGE_KEYS.orders, orders);

  clearSelection();
  renderQueue();
  showToast(`Order #${orderNumber} added to the queue.`);
}

function renderQueue() {
  const orders = readOrders();
  const activeOrders = orders.filter((order) => order.status !== "completed");

  elements.queueList.replaceChildren(
    ...(orders.length
      ? orders.map(createQueueCard)
      : [createEmptyState("No orders in the queue yet.")])
  );

  elements.nowServing.textContent = activeOrders[0]
    ? `Order #${activeOrders[0].orderNumber}`
    : "No active orders";
  elements.queueCount.textContent = `${activeOrders.length} ${activeOrders.length === 1 ? "order" : "orders"} waiting`;
}

function createQueueCard(order) {
  const card = document.createElement("article");
  card.className = "queue-card";

  const top = document.createElement("div");
  top.className = "queue-card-top";

  const heading = document.createElement("div");
  const meta = document.createElement("p");
  meta.className = "order-meta";
  meta.textContent = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const title = document.createElement("h3");
  title.textContent = `Order #${order.orderNumber}`;
  heading.append(meta, title);

  const status = document.createElement("span");
  status.className = `status-pill ${order.status === "completed" ? "completed" : ""}`;
  status.textContent = order.status === "completed" ? "Completed" : "Queued";

  top.append(heading, status);

  const list = document.createElement("ul");
  list.className = "queue-items";
  order.items.forEach((item) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = item.name;
    const quantity = document.createElement("strong");
    quantity.textContent = `x${item.quantity}`;
    row.append(label, quantity);
    list.appendChild(row);
  });

  card.append(top, list);
  return card;
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function init() {
  loadMenu();
  renderMenu();
  renderSummary();
  renderQueue();

  elements.orderForm.addEventListener("submit", placeOrder);
  elements.clearSelection.addEventListener("click", clearSelection);
  window.addEventListener("storage", renderQueue);
}

init();
