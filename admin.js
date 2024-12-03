
function initializeMenu() {
    const defaultMenu = {
        meals: ["Big Mac", "Cheeseburger", "Quarter Pounder", "Chicken Sandwich"],
        drinks: ["Coca-Cola", "Sprite", "Fanta", "Pepsi"]
    };
    const storedMenu = JSON.parse(localStorage.getItem("menu"));
    if (!storedMenu) {
        localStorage.setItem("menu", JSON.stringify(defaultMenu));
    }
}

function displayMenuManagement() {
    const menu = JSON.parse(localStorage.getItem("menu")) || { meals: [], drinks: [] };
    const mealList = document.getElementById("mealList");
    const drinkList = document.getElementById("drinkList");

    mealList.innerHTML = "";
    drinkList.innerHTML = "";

    menu.meals.forEach((meal, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = meal;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            menu.meals.splice(index, 1);
            localStorage.setItem("menu", JSON.stringify(menu));
            displayMenuManagement();
        });

        listItem.appendChild(removeButton);
        mealList.appendChild(listItem);
    });

    menu.drinks.forEach((drink, index) => {
        const listItem = document.createElement("li");
        listItem.textContent = drink;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            menu.drinks.splice(index, 1);
            localStorage.setItem("menu", JSON.stringify(menu));
            displayMenuManagement();
        });

        listItem.appendChild(removeButton);
        drinkList.appendChild(listItem);
    });
}

document.getElementById("addProductForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const productName = document.getElementById("productName").value.trim();
    const productType = document.getElementById("productType").value;

    if (!productName) {
        alert("Please enter a product name!");
        return;
    }

    const menu = JSON.parse(localStorage.getItem("menu")) || { meals: [], drinks: [] };

    if (productType === "meal") {
        menu.meals.push(productName);
    } else if (productType === "drink") {
        menu.drinks.push(productName);
    }

    localStorage.setItem("menu", JSON.stringify(menu));
    displayMenuManagement();
    this.reset();
    syncMenuWithCustomerPage();
});

function syncMenuWithCustomerPage() {
    const menu = JSON.parse(localStorage.getItem("menu"));
    localStorage.setItem("menu", JSON.stringify(menu));
}

function displayAdminQueue() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const adminQueueList = document.getElementById("adminQueueList");
    adminQueueList.innerHTML = "";

    orders.forEach((order, index) => {
        const listItem = document.createElement("li");

        const items = Object.entries(order.orderDetails)
            .map(([item, qty]) => `${qty}x ${item}`)
            .join(", ");

        listItem.textContent = `Order #${order.orderNumber}: ${items}`;

        const completeButton = document.createElement("button");
        completeButton.textContent = "Complete";
        completeButton.addEventListener("click", () => {
            orders.splice(index, 1);
            localStorage.setItem("orders", JSON.stringify(orders));
            displayAdminQueue();
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            orders.splice(index, 1);
            localStorage.setItem("orders", JSON.stringify(orders));
            displayAdminQueue();
        });

        listItem.appendChild(completeButton);
        listItem.appendChild(removeButton);
        adminQueueList.appendChild(listItem);
    });
}

initializeMenu();
displayMenuManagement();
displayAdminQueue();
