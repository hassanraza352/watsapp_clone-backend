const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    profilePic: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "Hey! I am using Chat App.",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    friends: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
],
isOnline: {
    type: Boolean,
    default: false,
},

lastSeen: {
    type: Date,
    default: null,
}

  },
  {
    timestamps: true,
  }
  
);

module.exports = mongoose.model("User", userSchema);