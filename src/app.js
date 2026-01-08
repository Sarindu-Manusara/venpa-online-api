const express = require("express");
const cors = require("cors");

const departmentsRoutes = require("./routes/departments.routes");
const categoriesRoutes = require("./routes/categories.routes");
const subcategoriesRoutes = require("./routes/subcategories.routes");
const productsRoutes = require("./routes/products.routes");
const syncRoutes = require("./routes/sync.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, service: "venpa-online-api" }));

app.use("/api/departments", departmentsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/sync", syncRoutes);

app.use(errorMiddleware);

module.exports = app;
