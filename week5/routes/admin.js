const express = require("express");

const router = express.Router();

const handleErrorAsync = require("../utils/handleErrorAsync");
const adminController = require("../controller/admin");
router.post(
  "/coaches/courses",
  handleErrorAsync(adminController.postAdminCourses)
);

router.put(
  "/coaches/courses/:courseId",
  handleErrorAsync(adminController.putAdmin)
);

router.post("/coaches/:userId", handleErrorAsync(adminController.postAdmin));

module.exports = router;
