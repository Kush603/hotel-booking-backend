const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ===============================
        // BASIC USER INFORMATION
        // ===============================
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [60, "Name cannot exceed 60 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
        },

        // ===============================
        // USER ROLE
        // ===============================
        role: {
            type: String,
            enum: {
                values: ["user", "hotel_owner", "admin"],
                message:
                    "{VALUE} is not a valid role. Allowed: user, hotel_owner, admin",
            },
            default: "user",
        },

        // ===============================
        // CONTACT INFORMATION
        // ===============================
        phone: {
            type: String,
            trim: true,
            default: "",
        },

        // ===============================
        // PROFILE
        // ===============================
        avatar: {
            type: String,
            default: "",
        },

        avatarLabel: {
            type: String,
            default: "SA",
        },

        // ===============================
        // USER PREFERENCES
        // ===============================
        preferences: {
            budget: {
                type: String,
                enum: ["budget", "moderate", "luxury"],
                default: "moderate",
            },

            styles: {
                type: [String],
                default: ["Cultural", "Food"],
            },

            interests: {
                type: [String],
                default: ["Museums", "Local Experiences"],
            },

            currency: {
                type: String,
                enum: ["USD", "INR", "EUR", "GBP"],
                default: "USD",
            },

            language: {
                type: String,
                enum: ["English", "Hindi", "French", "Spanish"],
                default: "English",
            },

            appearance: {
                type: String,
                enum: ["System", "Light", "Dark"],
                default: "System",
            },
        },

        // ===============================
        // SAVED HOTELS
        // ===============================
        savedHotels: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Hotel",
            },
        ],

        // ===============================
        // SAVED DESTINATIONS
        // ===============================
        savedDestinations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Destination",
            },
        ],

        // ===============================
        // SAVED TRIPS
        // ===============================
        savedTrips: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Trip",
            },
        ],

        // ===============================
        // ACCOUNT VERIFICATION
        // ===============================
        isVerified: {
            type: Boolean,
            default: false,
        },

        // ===============================
        // PASSWORD RESET
        // ===============================
        resetPasswordToken: {
            type: String,
        },

        resetPasswordExpire: {
            type: Date,
        },
    },

    {
        timestamps: true,
    }
);

// ===============================
// GENERATE AVATAR INITIALS
// ===============================
userSchema.pre("save", function () {
    if (this.name && (!this.avatarLabel || this.avatarLabel === "SA")) {
        const parts = this.name.trim().split(/\s+/);

        this.avatarLabel = parts
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }
});

// ===============================
// CREATE USER MODEL
// ===============================
const User = mongoose.model("User", userSchema);

module.exports = User;