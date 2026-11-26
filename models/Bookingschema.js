const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: [true, "Booking reference is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel reference is required"],
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room reference is required"],
    },
    hotelName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    roomName: {
      type: String,
      required: true,
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
    checkIn: {
      type: String,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: String,
      required: [true, "Check-out date is required"],
    },
    nights: {
      type: Number,
      required: [true, "Number of nights is required"],
      min: [1, "Nights must be at least 1"],
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "Guests must be at least 1"],
    },
    roomsCount: {
      type: Number,
      default: 1,
      min: [1, "Rooms count must be at least 1"],
    },
    guestName: {
      type: String,
      required: [true, "Guest name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Guest email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Guest phone number is required"],
      trim: true,
    },
    specialRequests: {
      type: String,
      default: "",
      trim: true,
    },
    roomTotal: {
      type: Number,
      required: [true, "Room total is required"],
      min: 0,
    },
    taxes: {
      type: Number,
      required: [true, "Taxes amount is required"],
      min: 0,
    },
    serviceFee: {
      type: Number,
      required: [true, "Service fee is required"],
      min: 0,
    },
    total: {
      type: Number,
      required: [true, "Total amount is required"],
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "INR", "EUR", "GBP"],
      default: "USD",
    },
    payment: {
      method: {
        type: String,
        enum: ["Card", "UPI", "Net Banking", "Wallet", "Apple Pay", "Google Pay", "Cash"],
        default: "Card",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "paid",
      },
      transactionId: {
        type: String,
        default: () => `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      },
      paidAt: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: {
        values: ["upcoming", "completed", "cancelled"],
        message: "{VALUE} is not a valid booking status",
      },
      default: "upcoming",
      index: true,
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation until 48 hours before check-in.",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    cancelledAt: {
      type: Date,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    digitalPass: {
      qrCodeData: {
        type: String,
        default: "",
      },
      wifiNetwork: {
        type: String,
        default: "StayAI-Guest",
      },
      wifiPassword: {
        type: String,
        default: "welcome2026",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate reference code before saving if not present
bookingSchema.pre("validate", function () {
  if (!this.reference) {
    this.reference = `ST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  if (!this.digitalPass.qrCodeData) {
    this.digitalPass.qrCodeData = `BOOKING:${this.reference}|HOTEL:${this.hotelName}|ROOM:${this.roomType}|BED:${this.bedType}|DATES:${this.checkIn}_${this.checkOut}`;
  }
});

// Indexes for high performance querying
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ hotel: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
