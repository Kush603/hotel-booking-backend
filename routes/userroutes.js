const express = require("express");
const router = express.Router();

const User = require("../models/Userschema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/multer");

// @route   POST /api/users/upload-avatar
// @desc    Upload user profile avatar to Cloudinary
// @access  Private (Protected)
router.post("/upload-avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file to upload",
      });
    }

    const avatarUrl = req.file.path; // Cloudinary returns the secure image URL in req.file.path

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded to Cloudinary successfully!",
      avatarUrl,
      user,
    });
  } catch (error) {
    console.error("Avatar Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/users/register (or /users/register, /api/users/signup)
// @desc    Register a new user or hotel owner
// @access  Public
router.post(["/register", "/signup"], async (req, res) => {
  try {
    const name = req.body.name || req.body.Name;
    const email = (req.body.email || req.body.Email || "").trim().toLowerCase();
    const password = req.body.password || req.body.Password;
    const phone = req.body.phone || req.body.Phone || "";
    const role = req.body.role || req.body.Role || "user";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    if (phone && phone.trim()) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists with another account",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone: phone || "",
      password: hashedPassword,
      role: role || "user",
    });

    const token = jwt.sign(
      {
        id: newUser._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/users/login (or /users/login, /api/users/signin)
// @desc    Authenticate user & get JWT token
// @access  Public
router.post(["/login", "/signin"], async (req, res) => {
  try {
    const email = (req.body.email || req.body.Email || "").trim().toLowerCase();
    const password = req.body.password || req.body.Password;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Explicitly select password since select: false in schema
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private (Protected)
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("savedHotels", "name city country pricePerNight images rating")
      .populate("savedDestinations", "name region country image");

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile & preferences
// @access  Private (Protected)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferences) {
      user.preferences = {
        ...user.preferences.toObject(),
        ...preferences,
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/users/toggle-save-hotel/:hotelId
// @desc    Save or remove hotel from bookmarks
// @access  Private (Protected)
router.post("/toggle-save-hotel/:hotelId", protect, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.savedHotels.indexOf(hotelId);
    let isSaved = false;

    if (index > -1) {
      user.savedHotels.splice(index, 1);
      isSaved = false;
    } else {
      user.savedHotels.push(hotelId);
      isSaved = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      isSaved,
      message: isSaved ? "Hotel saved to favorites" : "Hotel removed from favorites",
      savedHotels: user.savedHotels,
    });
  } catch (error) {
    console.error("Toggle Save Hotel Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/users/delete-account
// @desc    Permanently delete account and all associated user data (App Store & Google Play requirement)
// @access  Private (Protected)
router.delete("/delete-account", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Remove associated bookings, trips, reviews, notifications
    const Booking = require("../models/Bookingschema");
    const Trip = require("../models/Tripschema");
    const Review = require("../models/Reviewschema");
    const Notification = require("../models/Notificationschema");

    await Booking.deleteMany({ user: userId });
    await Trip.deleteMany({ user: userId });
    await Review.deleteMany({ user: userId });
    await Notification.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;