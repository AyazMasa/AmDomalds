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

const elements = {
  addProductForm: document.querySelector("#addProductForm"),
  productName: document.querySelector("#productName"),
  productDescription: document.querySelector("#productDescription"),
  productType: document.querySelector("#productType"),
  productPrice: document.querySelector("#productPrice"),
  mealList: document.querySelector("#mealList"),
  drinkList: document.querySelector("#drinkList"),
  adminQueueList: document.querySelector("#adminQueueList"),
  adminOrderCount: document.querySelector("#adminOrderCount"),
  adminMenuCount: document.querySelector("#adminMenuCount"),
  clearCompleted: document.querySelector("#clearCompleted"),
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

function getMenu() {
  const storedMenu = readJson(STORAGE_KEYS.menu, null) || readJson("menu", null);
  const menu = normalizeMenu(storedMenu || DEFAULT_MENU);
  writeJson(STORAGE_KEYS.menu, menu);
  return menu;
}

function setMenu(menu) {
  writeJson(STORAGE_KEYS.menu, menu);
  renderMenuManagement();
  updateSummary();
}

function getOrders() {
  const storedOrders = readJson(STORAGE_KEYS.orders, null) || readJson("orders", []);
  const orders = storedOrders.map((order) => ({
    id: order.id || `${Date.now()}-${order.orderNumber || Math.random()}`,
    orderNumber: order.orderNumber || Math.floor(Math.random() * 900) + 100,
    items: Array.isArray(order.items)
      ? order.items
      : Object.entries(order.orderDetails || {}).map(([name, quantity]) => ({
          id: slugify(name),
          name,
          quantity,
          price: 0,
        })),
    status: order.status || "queued",
    createdAt: order.createdAt || new Date().toISOString(),
  }));
  writeJson(STORAGE_KEYS.orders, orders);
  return orders;
}

function setOrders(orders) {
  writeJson(STORAGE_KEYS.orders, orders);
  renderAdminQueue();
  updateSummary();
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

function createProductItem(product, type) {
  const item = document.createElement("article");
  item.className = "admin-item";

  const top = document.createElement("div");
  top.className = "admin-item-top";

  const text = document.createElement("div");
  const title = document.createElement("h4");
  title.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  text.append(title, description);

  const price = document.createElement("strong");
  price.className = "price";
  price.textContent = formatMoney(product.price);

  top.append(text, price);

  const removeButton = document.createElement("button");
  removeButton.className = "button danger";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => removeProduct(type, product.id));

  item.append(top, removeButton);
  return item;
}

function renderMenuManagement() {
  const menu = getMenu();
  elements.mealList.replaceChildren(
    ...(menu.meals.length ? menu.meals.map((product) => createProductItem(product, "meals")) : [createEmptyState("No meals yet.")])
  );
  elements.drinkList.replaceChildren(
    ...(menu.drinks.length ? menu.drinks.map((product) => createProductItem(product, "drinks")) : [createEmptyState("No drinks yet.")])
  );
}

function addProduct(event) {
  event.preventDefault();
  const menu = getMenu();
  const type = elements.productType.value;
  const name = elements.productName.value.trim();
  const description = elements.productDescription.value.trim();
  const price = Number(elements.productPrice.value);

  if (!name || !Number.isFinite(price) || price <= 0) {
    showToast("Enter a valid product name and price.");
    return;
  }

  const exists = [...menu.meals, ...menu.drinks].some(
    (product) => product.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    showToast("That product is already on the menu.");
    return;
  }

  menu[type].push({
    id: `${type}-${slugify(name)}-${Date.now()}`,
    name,
    description: description || (type === "meals" ? "Freshly prepared meal." : "Cold drink."),
    price,
  });

  setMenu(menu);
  elements.addProductForm.reset();
  elements.productPrice.value = "4.90";
  showToast(`${name} added to the menu.`);
}

function removeProduct(type, productId) {
  const menu = getMenu();
  const product = menu[type].find((item) => item.id === productId);
  menu[type] = menu[type].filter((item) => item.id !== productId);
  setMenu(menu);
  showToast(`${product ? product.name : "Product"} removed.`);
}

function renderAdminQueue() {
  const orders = getOrders();
  elements.adminQueueList.replaceChildren(
    ...(orders.length ? orders.map(createQueueCard) : [createEmptyState("No orders in the queue.")])
  );
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

  const actions = document.createElement("div");
  actions.className = "queue-actions";

  const completeButton = document.createElement("button");
  completeButton.className = "button secondary";
  completeButton.type = "button";
  completeButton.textContent = order.status === "completed" ? "Reopen" : "Complete";
  completeButton.addEventListener("click", () => toggleOrderStatus(order.id));

  const removeButton = document.createElement("button");
  removeButton.className = "button danger";
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => removeOrder(order.id));

  actions.append(completeButton, removeButton);
  card.append(top, list, actions);
  return card;
}

function toggleOrderStatus(orderId) {
  const orders = getOrders().map((order) =>
    order.id === orderId
      ? { ...order, status: order.status === "completed" ? "queued" : "completed" }
      : order
  );
  setOrders(orders);
}

function removeOrder(orderId) {
  const orders = getOrders().filter((order) => order.id !== orderId);
  setOrders(orders);
  showToast("Order removed.");
}

function clearCompletedOrders() {
  const orders = getOrders();
  const activeOrders = orders.filter((order) => order.status !== "completed");
  setOrders(activeOrders);
  showToast("Completed orders cleared.");
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function updateSummary() {
  const menu = getMenu();
  const orders = getOrders();
  const activeOrders = orders.filter((order) => order.status !== "completed").length;
  const menuCount = menu.meals.length + menu.drinks.length;

  elements.adminOrderCount.textContent = `${activeOrders} active ${activeOrders === 1 ? "order" : "orders"}`;
  elements.adminMenuCount.textContent = `${menuCount} menu ${menuCount === 1 ? "item" : "items"}`;
}

function init() {
  renderMenuManagement();
  renderAdminQueue();
  updateSummary();

  elements.addProductForm.addEventListener("submit", addProduct);
  elements.clearCompleted.addEventListener("click", clearCompletedOrders);
  window.addEventListener("storage", () => {
    renderMenuManagement();
    renderAdminQueue();
    updateSummary();
  });
}

init();
