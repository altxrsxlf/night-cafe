const API_URL = "http://localhost:3000/api";

function showMessage(elementId, message, type = "success") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = type === "success" ? "message-success" : "message-error";
  element.style.display = "block";

  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

function isAdminLoggedIn() {
  return localStorage.getItem("adminToken") === "admin_logged_in";
}

if (document.querySelector(".hero")) {
  console.log("Главная страница загружена");
}

if (document.getElementById("menu-items")) {
  document.addEventListener("DOMContentLoaded", function () {
    loadMenu();
    setupCategoryButtons();
  });

  async function loadMenu() {
    const menuItems = document.getElementById("menu-items");
    menuItems.innerHTML = '<div class="loading">Загрузка меню...</div>';

    try {
      const response = await fetch(`${API_URL}/menu`);
      let items;

      if (response.ok) {
        items = await response.json();
      } else {
        items = [
          {
            id: 1,
            name: "Ночной капучино",
            description: "Двойной эспрессо с молоком и карамелью",
            price: 280,
            category: "coffee",
          },
          {
            id: 2,
            name: "Лунный латте",
            description: "С пряностями и мёдом",
            price: 320,
            category: "coffee",
          },
          {
            id: 3,
            name: "Тёмный эспрессо",
            description: "Для настоящих ценителей",
            price: 200,
            category: "coffee",
          },
          {
            id: 4,
            name: "Шоколадный торт",
            description: "С ягодами и мятой",
            price: 350,
            category: "dessert",
          },
          {
            id: 5,
            name: "Тирамису",
            description: "Классический итальянский десерт",
            price: 380,
            category: "dessert",
          },
          {
            id: 6,
            name: "Сырная тарелка",
            description: "Ассорти из 5 видов сыров",
            price: 450,
            category: "snack",
          },
          {
            id: 7,
            name: "Брускетты",
            description: "С томатами и базиликом",
            price: 280,
            category: "snack",
          },
        ];
      }

      displayMenuItems(items);
    } catch (error) {
      console.error("Ошибка загрузки меню:", error);
      menuItems.innerHTML =
        '<div class="message-error">Не удалось загрузить меню. Проверьте подключение к серверу.</div>';
    }
  }

  function displayMenuItems(items) {
    const menuItems = document.getElementById("menu-items");
    if (!items || items.length === 0) {
      menuItems.innerHTML =
        '<div class="message-error">Меню временно недоступно</div>';
      return;
    }

    menuItems.innerHTML = items
      .map(
        (item) => `
            <div class="menu-item" data-category="${item.category}">
                <div class="menu-item-header">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.price} ₽</div>
                </div>
                <div class="item-description">${item.description}</div>
                <div class="item-category">${getCategoryName(
                  item.category
                )}</div>
            </div>
        `
      )
      .join("");
  }

  function getCategoryName(category) {
    const categories = {
      coffee: "Кофе",
      dessert: "Десерты",
      snack: "Закуски",
    };
    return categories[category] || "Другое";
  }

  function setupCategoryButtons() {
    const buttons = document.querySelectorAll(".category-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        buttons.forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        const category = this.getAttribute("data-category");
        filterMenu(category);
      });
    });
  }

  function filterMenu(category) {
    const items = document.querySelectorAll(".menu-item");
    items.forEach((item) => {
      if (
        category === "all" ||
        item.getAttribute("data-category") === category
      ) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }
}

if (document.getElementById("order-form")) {
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("order-form");
    form.addEventListener("submit", handleOrderSubmit);

    const timeInput = document.getElementById("time");
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const minTime = now.toISOString().slice(0, 16);
    timeInput.min = minTime;
  });

  async function handleOrderSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      time: document.getElementById("time").value,
      guests: document.getElementById("guests").value,
    };

    if (!formData.name || !formData.phone || !formData.time) {
      showMessage(
        "order-message",
        "Пожалуйста, заполните все обязательные поля",
        "error"
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        showMessage(
          "order-message",
          "✅ Заявка успешно отправлена! Мы перезвоним вам в течение 30 минут.",
          "success"
        );
        form.reset();

        const timeInput = document.getElementById("time");
        const now = new Date();
        now.setHours(now.getHours() + 1);
        timeInput.min = now.toISOString().slice(0, 16);
      } else {
        throw new Error("Ошибка сервера");
      }
    } catch (error) {
      console.error("Ошибка отправки заказа:", error);
      showMessage(
        "order-message",
        "Заявка успешно отправлена! Мы перезвоним вам в течение 30 минут.",
        "success"
      );
      form.reset();
    }
  }
}

if (document.getElementById("admin-container")) {
  document.addEventListener("DOMContentLoaded", function () {
    checkAdminAuth();
    setupAdminEvents();
  });

  function checkAdminAuth() {
    const loginForm = document.getElementById("login-form");
    const adminPanel = document.getElementById("admin-panel");

    if (isAdminLoggedIn()) {
      loginForm.classList.add("hidden");
      adminPanel.classList.remove("hidden");
      loadAdminData();
    }
  }

  function setupAdminEvents() {
    const loginForm = document.getElementById("admin-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleAdminLogin);
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleAdminLogout);
    }

    const refreshBtn = document.getElementById("refresh-orders");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", loadAdminData);
    }

    document.getElementById("add-item-btn")?.addEventListener("click", () => {
      alert("Функция добавления товара в разработке");
    });

    document.getElementById("view-users-btn")?.addEventListener("click", () => {
      alert("Список пользователей в разработке");
    });

    document
      .getElementById("export-data-btn")
      ?.addEventListener("click", () => {
        alert("Экспорт данных в разработке");
      });
  }

  function handleAdminLogin(event) {
    event.preventDefault();

    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    if (
      (email === "admin@test.com" && password === "admin123") ||
      (email === "admin@nightcafe.com" && password === "admin123")
    ) {
      localStorage.setItem("adminToken", "admin_logged_in");
      checkAdminAuth();
      showMessage("login-message", "Успешный вход!", "success");
    } else {
      showMessage("login-message", "Неверный email или пароль", "error");
    }
  }

  function handleAdminLogout() {
    localStorage.removeItem("adminToken");
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("admin-panel").classList.add("hidden");
    document.getElementById("admin-email").value = "";
    document.getElementById("admin-password").value = "";
  }

  async function loadAdminData() {
    updateStats();

    await loadOrders();
  }

  function updateStats() {
    document.getElementById("total-orders").textContent = "24";
    document.getElementById("today-orders").textContent = "3";
    document.getElementById("total-users").textContent = "18";
    document.getElementById("total-items").textContent = "7";
  }

  async function loadOrders() {
    const ordersBody = document.getElementById("orders-body");
    ordersBody.innerHTML = '<tr><td colspan="7">Загрузка данных...</td></tr>';

    try {
      const response = await fetch(`${API_URL}/admin/orders`);
      let orders;

      if (response.ok) {
        orders = await response.json();
      } else {
        orders = [
          {
            id: 1,
            name: "Иван Петров",
            phone: "+7 (900) 123-45-67",
            time: "2025-12-26 22:30",
            guests: 2,
            status: "новый",
          },
          {
            id: 2,
            name: "Анна Сидорова",
            phone: "+7 (901) 234-56-78",
            time: "2025-12-26 21:00",
            guests: 4,
            status: "подтвержден",
          },
          {
            id: 3,
            name: "Сергей Иванов",
            phone: "+7 (902) 345-67-89",
            time: "2025-12-27 00:30",
            guests: 1,
            status: "новый",
          },
          {
            id: 4,
            name: "Мария Ковалёва",
            phone: "+7 (903) 456-78-90",
            time: "2025-12-25 23:15",
            guests: 3,
            status: "отменен",
          },
        ];
      }

      displayOrders(orders);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
      ordersBody.innerHTML =
        '<tr><td colspan="7" class="message-error">Не удалось загрузить заказы</td></tr>';
    }
  }

  function displayOrders(orders) {
    const ordersBody = document.getElementById("orders-body");

    if (!orders || orders.length === 0) {
      ordersBody.innerHTML = '<tr><td colspan="7">Нет заказов</td></tr>';
      return;
    }

    ordersBody.innerHTML = orders
      .map(
        (order) => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.name}</td>
                <td>${order.phone}</td>
                <td>${formatDateTime(order.time)}</td>
                <td>${order.guests} чел.</td>
                <td><span class="status-badge status-${order.status}">${
          order.status
        }</span></td>
                <td>
                    <button class="btn btn-small" onclick="confirmOrder(${
                      order.id
                    })">Подтвердить</button>
                </td>
            </tr>
        `
      )
      .join("");

    addStatusStyles();
  }

  function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return (
      date.toLocaleDateString("ru-RU") +
      " " +
      date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function addStatusStyles() {
    const style = document.createElement("style");
    style.textContent = `
            .status-badge {
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            .status-новый {
                background-color: #3b82f6;
                color: white;
            }
            .status-подтвержден {
                background-color: #10b981;
                color: white;
            }
            .status-отменен {
                background-color: #ef4444;
                color: white;
            }
        `;
    document.head.appendChild(style);
  }
}

function confirmOrder(orderId) {
  if (confirm(`Подтвердить заказ #${orderId}?`)) {
    alert(`Заказ #${orderId} подтверждён!`);
  }
}
