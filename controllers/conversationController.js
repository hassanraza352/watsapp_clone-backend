const Conversation = require("../models/conversationSchema");
const mongoose = require("mongoose");
const Contact = require("../models/contact");

const createConversation = async (req, res) => {
    try {

        const { contactId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Contact ID",
            });
        }

        // Prevent chatting with yourself
        if (contactId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot create a conversation with yourself",
            });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user._id, contactId],
            },
        });

        // If not found, create one
        if (!conversation) {

            conversation = await Conversation.create({
                participants: [req.user._id, contactId],
            });

        }

        return res.status(200).json({
            success: true,
            conversation,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};
const getConversation = async (req, res) => {
    try {

        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Conversation ID",
            });
        }

        const conversation = await Conversation.findById(conversationId)
            .populate("participants", "name email profilePic")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "name email profilePic",
                },
            });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some((user) =>
             user._id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        return res.status(200).json({
            success: true,
            conversation,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};


const getConversations = async (req, res) => {
    try {

        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate("participants", "name email profilePic")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "name email profilePic",
                },
            })
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            conversations,
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};




const getMyConversations = async (req, res) => {
    try {

        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate("participants", "name email profilePic")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name"
            }
        })
        .sort({ updatedAt: -1 });

        const finalData = [];

        for (const conversation of conversations) {

            const otherUser = conversation.participants.find(
                p => p._id.toString() !== req.user._id.toString()
            );

            const contact = await Contact.findOne({
                owner: req.user._id,
                contact: otherUser._id
            });

            finalData.push({

                _id: conversation._id,

                participant: {

                    _id: otherUser._id,

                    email: otherUser.email,

                    profilePic: otherUser.profilePic,

                    name: contact
                        ? contact.displayName
                        : otherUser.name

                },

                lastMessage: conversation.lastMessage,

                updatedAt: conversation.updatedAt

            });

        }

        res.json({

            success: true,

            conversations: finalData

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }
};

module.exports = {
    createConversation,
    getConversation,
    getConversations,
    getMyConversations
};