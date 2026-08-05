const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addContact
    ,getContacts,
    deleteContact,
} = require("../controllers/contactController");

router.post("/", protect, addContact);

router.get("/", protect, getContacts);

router.delete("/:id", protect, deleteContact);

module.exports = router;