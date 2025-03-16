const express = require("express");

const router = express.Router();

const handleErrorAsync = require("../utils/handleErrorAsync");
const skillController = require("../controller/skill");
router.get("/", handleErrorAsync(skillController.getSkill));

router.post("/", handleErrorAsync(skillController.postSkill));

router.delete("/:skillId", handleErrorAsync(skillController.deleteSkill));

module.exports = router;
