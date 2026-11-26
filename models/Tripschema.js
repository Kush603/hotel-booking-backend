const mongoose = require("mongoose");

const daySlotSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    detail: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const tripDaySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
    },
    slots: {
      type: [daySlotSchema],
      default: [],
    },
    restaurant: {
      type: String,
      default: "",
    },
    transport: {
      type: String,
      default: "Walk + metro",
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required for a trip plan"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Trip destination name is required"],
      trim: true,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
    },
    checkIn: {
      type: String,
      required: [true, "Start date is required"],
    },
    checkOut: {
      type: String,
      required: [true, "End date is required"],
    },
    travellers: {
      type: Number,
      default: 2,
      min: 1,
    },
    budget: {
      type: String,
      enum: ["budget", "moderate", "luxury"],
      default: "moderate",
    },
    styles: {
      type: [String],
      default: ["Cultural"],
    },
    interests: {
      type: [String],
      default: ["Local Experiences"],
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    dailyBudget: {
      type: Number,
      default: 0,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },
    hotelName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "upcoming", "completed"],
      default: "upcoming",
      index: true,
    },
    days: {
      type: [tripDaySchema],
      default: [],
    },
    recommendedHotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],
    restaurants: {
      type: [String],
      default: [],
    },
    attractions: {
      type: [String],
      default: [],
    },
    transport: {
      type: String,
      default: "Walk where you can; reserve transfers for arrival and departure.",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ user: 1, status: 1 });

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;
