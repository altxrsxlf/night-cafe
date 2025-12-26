const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Сервер Night Cafe работает!");
});

app.get("/api/menu", (req, res) => {
  res.json([
    { id: 1, name: "Капучино", price: 250 },
    { id: 2, name: "Тирамису", price: 300 },
  ]);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
