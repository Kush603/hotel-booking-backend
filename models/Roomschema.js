const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel reference is required for a room"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      maxlength: [80, "Room name cannot exceed 80 characters"],
    },
    roomType: {
      type: String,
      required: [true, "Room type is required"],
      enum: {
        values: [
          "Deluxe Room",
          "Super Deluxe Room",
          "AC Room",
          "Non-AC Room",
          "Standard Room",
          "Executive Suite",
          "Presidential Suite",
          "Family Suite",
        ],
        message: "{VALUE} is not a valid room type",
      },
      default: "Deluxe Room",
    },
    bedType: {
      type: String,
      required: [true, "Bed type is required"],
      enum: {
        values: [
          "Queen Size Bed",
          "King Size Bed",
          "Double Bed",
          "Single Bed",
          "Twin Bed",
        ],
        message: "{VALUE} is not a valid bed type",
      },
      default: "Queen Size Bed",
    },
    guests: {
      type: Number,
      required: [true, "Guest capacity is required"],
      min: [1, "Guest capacity must be at least 1"],
      max: [10, "Guest capacity cannot exceed 10"],
      default: 2,
    },
    sizeSqm: {
      type: Number,
      default: 24,
      min: [10, "Room size must be at least 10 sqm"],
    },
    amenities: {
      type: [String],
      default: ["Wi-Fi", "Climate control", "Workspace"],
    },
    breakfastIncluded: {
      type: Boolean,
      default: false,
    },
    freeCancellation: {
      type: Boolean,
      default: true,
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation until 24 hours before check-in.",
    },
    pricePerNight: {
      type: Number,
      required: [true, "Room price per night is required"],
      min: [0, "Room price cannot be negative"],
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    totalInventory: {
      type: Number,
      default: 5,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying rooms of a hotel sorted by price
roomSchema.index({ hotel: 1, pricePerNight: 1 });

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
