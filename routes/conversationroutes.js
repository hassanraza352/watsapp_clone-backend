const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    createConversation,
    getConversation,
    getConversations,
    getMyConversations
} = require("../controllers/conversationController");

const protect = require("../middleware/authMiddleware");




const { sendMessage,getMessages } = require("../controllers/messageController");



router.post("/conversation/:contactId", authMiddleware, createConversation);

router.get("/conversation/:conversationId", authMiddleware, getConversation);

router.get("/conversations", authMiddleware, getConversations);
router.post("/messages",  authMiddleware, sendMessage);
router.get("/messages/:conversationId", authMiddleware, getMessages);
router.get("/myconversations",protect,getMyConversations);

module.exports = router;