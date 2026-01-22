const router = require("express").Router();
const c = require("../controllers/profile.controller");
const auth = require("../middleware/auth.middleware");

router.get("/summary", auth, c.getProfileSummary);

module.exports = router;
