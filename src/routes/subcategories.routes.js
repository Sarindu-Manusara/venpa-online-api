const router = require("express").Router();
const c = require("../controllers/subcategories.controller");

router.get("/", c.list);
router.get("/:id", c.getById);

module.exports = router;
