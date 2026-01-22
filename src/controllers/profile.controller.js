const { QueryTypes } = require("sequelize");
const { sequelize, Product, ProductImage } = require("../models");

async function safeCount(table, column, userId) {
  try {
    const rows = await sequelize.query(
      `SELECT COUNT(*) as count FROM \`${table}\` WHERE \`${column}\` = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    return Number(rows?.[0]?.count || 0);
  } catch (err) {
    console.warn(`Profile count skipped for ${table}.${column}:`, err.message);
    return 0;
  }
}

exports.getProfileSummary = async (req, res, next) => {
  try {
    const user = req.user.toJSON();
    delete user.password;

    const ordersTable = process.env.ORDERS_TABLE || "orders";
    const ordersUserColumn = process.env.ORDERS_USER_COLUMN || "user_id";
    const reviewsTable = process.env.REVIEWS_TABLE || "reviews";
    const reviewsUserColumn = process.env.REVIEWS_USER_COLUMN || "user_id";

    const [orderCount, reviewCount] = await Promise.all([
      safeCount(ordersTable, ordersUserColumn, req.user.id),
      safeCount(reviewsTable, reviewsUserColumn, req.user.id)
    ]);

    const recommended = await Product.findAll({
      limit: 10,
      order: sequelize.random(),
      include: [{ model: ProductImage, as: "images" }]
    });

    res.json({
      user,
      stats: {
        orders: orderCount,
        reviews: reviewCount,
        points: 0
      },
      recommended
    });
  } catch (e) { next(e); }
};
