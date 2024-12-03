
function loadMenu() {
    const menu = JSON.parse(localStorage.getItem("menu")) || { meals: [], drinks: [] };
    const mealsMenu = document.getElementById("mealsMenu");
    const drinksMenu = document.getElementById("drinksMenu");

    mealsMenu.innerHTML = "";
    drinksMenu.innerHTML = "";

    menu.meals.forEach(meal => {
        const div = document.createElement("div");
        div.className = "menu-item";
        div.innerHTML = `
            <span>${meal}</span>
            <div class="quantity-controls">
                <button type="button" class="decrement" data-item="${meal}">-</button>
                <span class="quantity" id="${meal}-quantity">0</span>
                <button type="button" class="increment" data-item="${meal}">+</button>
            </div>
        `;
        mealsMenu.appendChild(div);
    });

    menu.drinks.forEach(drink => {
        const div = document.createElement("div");
        div.className = "menu-item";
        div.innerHTML = `
            <span>${drink}</span>
            <div class="quantity-controls">
                <button type="button" class="decrement" data-item="${drink}">-</button>
                <span class="quantity" id="${drink}-quantity">0</span>
                <button type="button" class="increment" data-item="${drink}">+</button>
            </div>
        `;
        drinksMenu.appendChild(div);
    });

    attachQuantityEventListeners();
}

function attachQuantityEventListeners() {
    const quantities = {};

    document.querySelectorAll(".increment").forEach(button => {
        button.addEventListener("click", () => {
            const item = button.getAttribute("data-item");
            quantities[item] = (quantities[item] || 0) + 1;
            document.getElementById(`${item}-quantity`).textContent = quantities[item];
        });
    });

    document.querySelectorAll(".decrement").forEach(button => {
        button.addEventListener("click", () => {
            const item = button.getAttribute("data-item");
            if (quantities[item] && quantities[item] > 0) {
                quantities[item] -= 1;
                document.getElementById(`${item}-quantity`).textContent = quantities[item];
            }
        });
    });
}

document.getElementById("orderForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const orderDetails = {};
    document.querySelectorAll(".quantity").forEach(span => {
        const item = span.id.replace("-quantity", "");
        const quantity = parseInt(span.textContent, 10);
        if (quantity > 0) {
            orderDetails[item] = quantity;
        }
    });

    if (Object.keys(orderDetails).length === 0) {
        alert("Please select at least one item!");
        return;
    }

    const orderNumber = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    const newOrder = { orderNumber, orderDetails };

    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));

    displayQueue();
    resetAllQuantities();
});

function resetAllQuantities() {
    document.querySelectorAll(".quantity").forEach(span => {
        span.textContent = "0";
    });
}

function displayQueue() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const queueList = document.getElementById("queueList");
    queueList.innerHTML = "";

    orders.forEach(order => {
        const listItem = document.createElement("li");

        const items = Object.entries(order.orderDetails)
            .map(([item, qty]) => `${qty}x ${item}`)
            .join(", ");

        listItem.textContent = `Order #${order.orderNumber}: ${items}`;

        queueList.appendChild(listItem);
    });
}

// Initialize menu and attach event listeners
loadMenu();
displayQueue();
