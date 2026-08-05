const mongoose = require("mongoose");
const User = require("../models/user");
const Contact = require("../models/contact");
const Conversation = require("../models/conversationSchema");

const addContact = async (req, res) => {
    try {

        const { email, displayName } = req.body;

        if (!email || !displayName) {
            return res.status(400).json({
                success: false,
                message: "Email and Display Name are required",
            });
        }

        // Find user by email
        const contactUser = await User.findOne({ email });

        if (!contactUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent adding yourself
        if (contactUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot add yourself as a contact",
            });
        }

        // Check duplicate contact
        const existingContact = await Contact.findOne({
            owner: req.user._id,
            contact: contactUser._id,
        });

        if (existingContact) {
            return res.status(409).json({
                success: false,
                message: "Contact already exists",
            });
        }

        // Create contact
        const newContact = await Contact.create({
            owner: req.user._id,
            contact: contactUser._id,
            displayName: displayName.trim(),
        });

        // ==========================
        // Create conversation if not exists
        // ==========================
        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user._id, contactUser._id],
            },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, contactUser._id],
            });
        }

        const savedContact = await Contact.findById(newContact._id)
            .populate("contact", "name email profilePic");

        return res.status(201).json({
            success: true,
            message: "Contact added successfully",
            contact: savedContact,
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

const getContacts = async (req, res) => {
    try {

        const contacts = await Contact.find({
            owner: req.user._id,
        })
        .populate(
    "contact",
    "name email profilePic isOnline lastSeen"
)
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};


const deleteContact = async (req, res) => {
    try {

        const { id } = req.params;

        const contact = await Contact.findOne({
            _id: id,
            owner: req.user._id,
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact not found",
            });
        }

        await Contact.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Contact deleted successfully",
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
    addContact,
    getContacts,
    deleteContact,
};