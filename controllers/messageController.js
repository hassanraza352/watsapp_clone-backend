const Message = require("../models/messages");
const Conversation = require("../models/conversationSchema");
const mongoose = require("mongoose");

const sendMessage = async (req, res) => {
    try {

        const { conversationId, text } = req.body;

        // Validation
        if (!conversationId || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID and message are required",
            });
        }

        // Validate Conversation ID
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Conversation ID",
            });
        }

        // Find Conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Security Check
        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Create Message
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: text.trim(),
        });

        // Update Last Message
        conversation.lastMessage = message._id;
        await conversation.save();

        // Populate Sender
        const savedMessage = await Message.findById(message._id)
            .populate("sender", "name email profilePic");

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: savedMessage,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

const getMessages = async (req, res) => {
    try {

        const { conversationId } = req.params;

        // Validate Conversation ID
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Conversation ID",
            });
        }

        // Find Conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Security Check
        const isParticipant = conversation.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Get Messages
        const messages = await Message.find({
            conversation: conversationId,
        })
            .populate("sender", "name email profilePic")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: messages.length,
            messages,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

module.exports = {
    sendMessage,
    getMessages,
};