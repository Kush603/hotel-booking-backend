const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hotel owner reference is required"],
    },
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: [100, "Hotel name cannot exceed 100 characters"],
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
    },
    destinationSlug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location/address is required"],
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        default: 0,
      },
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricePerNight: {
      type: Number,
      required: [true, "Base price per night is required"],
      min: [0, "Price cannot be negative"],
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one hotel image is required",
      },
    },
    amenities: {
      type: [String],
      default: ["Wi-Fi", "Breakfast", "Concierge"],
    },
    facilities: {
      type: [String],
      default: ["24h desk", "Luggage storage"],
    },
    description: {
      type: String,
      required: [true, "Hotel description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Hotel category is required"],
      enum: {
        values: [
          "3 Star Hotel",
          "4 Star Hotel",
          "5 Star Hotel",
          "Normal Hotel",
          "Resort",
          "Luxury Resort",
          "Boutique Hotel",
          "Heritage Hotel",
          "Villa",
          "Apartment",
          "Guest House",
        ],
        message: "{VALUE} is not a valid hotel category",
      },
      default: "3 Star Hotel",
      index: true,
    },
    stars: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 3,
      index: true,
    },
    hotelType: {
      type: String,
      enum: {
        values: [
          "Hotel",
          "Normal Hotel",
          "3 Star Hotel",
          "4 Star Hotel",
          "5 Star Hotel",
          "Resort",
          "Luxury Resort",
          "Boutique",
          "Business",
          "Heritage",
          "Villa",
          "Apartment",
          "Guest House",
        ],
        message: "{VALUE} is not a valid hotel type",
      },
      default: "Hotel",
      index: true,
    },
    distanceKm: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    breakfastIncluded: {
      type: Boolean,
      default: false,
    },
    freeCancellation: {
      type: Boolean,
      default: true,
    },
    checkIn: {
      type: String,
      default: "15:00",
    },
    checkOut: {
      type: String,
      default: "11:00",
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation until 48 hours before check-in.",
    },
    aiReviewSummary: {
      sentimentScore: {
        type: Number,
        default: 95,
        min: 0,
        max: 100,
      },
      pros: {
        type: [String],
        default: [],
      },
      cons: {
        type: [String],
        default: [],
      },
      bestFor: {
        type: String,
        default: "Couples & Culture Lovers",
      },
    },
    stayAILocalGuide: {
      nearbyAttractions: {
        type: [String],
        default: [],
      },
      famousFoods: {
        type: [String],
        default: [],
      },
      localTips: {
        type: String,
        default: "Ask concierge for morning walking tours and local sunset spots.",
      },
    },
    priceTrend: {
      type: String,
      enum: ["dropping", "stable", "rising"],
      default: "stable",
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all rooms belonging to this hotel
hotelSchema.virtual("rooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "hotel",
});

// Virtual for getting all reviews belonging to this hotel
hotelSchema.virtual("guestReviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "hotel",
});

// Indexes for fast searching and filtering
hotelSchema.index({ name: "text", city: "text", location: "text" });
hotelSchema.index({ city: 1, pricePerNight: 1 });
hotelSchema.index({ hotelType: 1, rating: -1 });
hotelSchema.index({ category: 1, stars: 1 });
hotelSchema.index({ owner: 1 });

const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;
