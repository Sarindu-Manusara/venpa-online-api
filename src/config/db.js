const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASS,
  {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: "mysql",
    logging: false,
    define: {
      freezeTableName: true, // use table name exactly as in DB
      underscored: true, // maps created_at, updated_at
      engine: "InnoDB",
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci"
    },
  }
);

module.exports = sequelize;
