require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");
const { startSyncJobs } = require("./services/sync/syncJobs");

const PORT = Number(process.env.PORT || 4000);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connect wuna!");

    if (process.env.SYNC_ENABLED === "true") {
      startSyncJobs();
      console.log("Sync jobs tika start wuna!");
    }

    app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Startup error ekak :(", err);
    process.exit(1);
  }
})();
