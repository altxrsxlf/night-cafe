const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Ошибка подключения к БД:", err.message);
  } else {
    console.log("Подключено к SQLite базе данных");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        order_time DATETIME NOT NULL,
        guests INTEGER DEFAULT 1,
        status TEXT DEFAULT 'новый',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        is_available BOOLEAN DEFAULT 1,
        image_url TEXT
    )`);

  addTestData();
}

function addTestData() {
  db.get(
    "SELECT COUNT(*) as count FROM users WHERE email = 'admin@test.com'",
    (err, row) => {
      if (err) return;

      if (row.count === 0) {
        db.run(
          "INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
          [
            "admin@test.com",
            "Администратор",
            "+7 (900) 000-00-00",
            "admin123",
            "admin",
          ]
        );

        db.run(
          "INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)",
          [
            "user@test.com",
            "Тестовый Пользователь",
            "+7 (900) 111-11-11",
            "user123",
          ]
        );

        console.log("Тестовые пользователи созданы");
      }
    }
  );

  db.get("SELECT COUNT(*) as count FROM menu_items", (err, row) => {
    if (err) return;

    if (row.count === 0) {
      const menuItems = [
        [
          "Ночной капучино",
          "Двойной эспрессо с молоком и карамелью",
          280,
          "coffee",
          "",
        ],
        ["Лунный латте", "С пряностями и мёдом", 320, "coffee", ""],
        ["Тёмный эспрессо", "Для настоящих ценителей", 200, "coffee", ""],
        ["Шоколадный торт", "С ягодами и мятой", 350, "dessert", ""],
        ["Тирамису", "Классический итальянский десерт", 380, "dessert", ""],
        ["Сырная тарелка", "Ассорти из 5 видов сыров", 450, "snack", ""],
        ["Брускетты", "С томатами и базиликом", 280, "snack", ""],
      ];

      const stmt = db.prepare(
        "INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)"
      );

      menuItems.forEach((item) => {
        stmt.run(item);
      });

      stmt.finalize();
      console.log("Тестовое меню создано");
    }
  });

  db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
    if (err) return;

    if (row.count === 0) {
      const orders = [
        [
          1,
          "Иван Петров",
          "+7 (900) 123-45-67",
          "2025-12-26 22:30:00",
          2,
          "новый",
        ],
        [
          2,
          "Анна Сидорова",
          "+7 (901) 234-56-78",
          "2025-12-26 21:00:00",
          4,
          "подтвержден",
        ],
        [
          1,
          "Сергей Иванов",
          "+7 (902) 345-67-89",
          "2025-12-27 00:30:00",
          1,
          "новый",
        ],
        [
          2,
          "Мария Ковалёва",
          "+7 (903) 456-78-90",
          "2025-12-25 23:15:00",
          3,
          "отменен",
        ],
      ];

      const stmt = db.prepare(
        "INSERT INTO orders (user_id, name, phone, order_time, guests, status) VALUES (?, ?, ?, ?, ?, ?)"
      );

      orders.forEach((order) => {
        stmt.run(order);
      });

      stmt.finalize();
      console.log("Тестовые заказы созданы");
    }
  });
}

app.post("/api/register", (req, res) => {
  const { email, name, phone, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  db.run(
    "INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)",
    [email, name, phone, password],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Пользователь уже существует" });
      }
      res.json({
        message: "Пользователь создан",
        userId: this.lastID,
      });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  db.get(
    "SELECT * FROM users WHERE email = ? AND password_hash = ?",
    [email, password],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Неверные учетные данные" });
      }
      res.json({
        message: "Успешный вход",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }
  );
});

app.get("/api/menu", (req, res) => {
  db.all("SELECT * FROM menu_items WHERE is_available = 1", (err, items) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка базы данных" });
    }
    res.json(items);
  });
});

app.post("/api/order", (req, res) => {
  const { name, phone, time, guests } = req.body;

  if (!name || !phone || !time) {
    return res
      .status(400)
      .json({ error: "Обязательные поля: имя, телефон, время" });
  }

  db.run(
    "INSERT INTO orders (name, phone, order_time, guests) VALUES (?, ?, ?, ?)",
    [name, phone, time, guests || 1],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Ошибка создания заказа" });
      }
      res.json({
        message: "Заказ создан",
        orderId: this.lastID,
      });
    }
  );
});

app.get("/api/admin/orders", (req, res) => {
  db.all(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 50",
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: "Ошибка базы данных" });
      }
      res.json(orders);
    }
  );
});

app.get("/api/admin/stats", (req, res) => {
  const stats = {};

  db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
    if (err) return res.status(500).json({ error: "Ошибка БД" });
    stats.totalOrders = row.count;

    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) return res.status(500).json({ error: "Ошибка БД" });
      stats.totalUsers = row.count;

      db.get("SELECT COUNT(*) as count FROM menu_items", (err, row) => {
        if (err) return res.status(500).json({ error: "Ошибка БД" });
        stats.totalItems = row.count;

        const today = new Date().toISOString().split("T")[0];
        db.get(
          "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?",
          [today],
          (err, row) => {
            if (err) return res.status(500).json({ error: "Ошибка БД" });
            stats.todayOrders = row.count;

            res.json(stats);
          }
        );
      });
    });
  });
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}/api/`);
  console.log(`Тестовый администратор: admin@test.com / admin123`);
  console.log(`Тестовый пользователь: user@test.com / user123`);
});
