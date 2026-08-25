const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {register,login,getMe,logout,updateProfile}=require("../controllers/authcontroller");

router.post("/register", register);
router.post("/login", login );
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
// router.put("/profile", protect, updateProfile);


router.put(
    "/profile",
     protect,
    upload.single("profilePic"),
    updateProfile
);

module.exports = router;