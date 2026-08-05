const User =require("../models/user");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");


const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

   const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
    name,
    email,
    password: hashedPassword,
});

   res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
    },
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required"
            });
        }
         const user = await User.findOne({ email });

         if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
         const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
        }
         
        const token = generateToken(user._id);
        // production k liye 
        //secure: true,
        //sameSite: "none",
    res.cookie("token", token, {
           httpOnly: true,
           secure: false,      // localhost
           sameSite: "lax",
           maxAge: 7 * 24 * 60 * 60 * 1000,
            }
        );
          user.password = undefined;

        res.status(200).json({
            success: true,
            message: "Login Successful",
            user
        });


  }
  catch(error){
    console.log("errro while login, ", error.message);
  }

}


const getMe = async (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });

};


const logout = (req, res) => {

    res.clearCookie("token", {
    httpOnly: true,
    secure: false,      // localhost
    sameSite: "lax",
});

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });

};

const updateProfile = async (req, res) => {
    try {

        const { name, about } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,{ 
                name,
                bio:about
            },
            {
                new: true,
            }
        ).select("-password");

        res.json({
            success: true,
            user: updatedUser,
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }
};


module.exports = {
    register,
    login,
    getMe,
    logout,
    updateProfile
};