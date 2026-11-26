const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel reference is required"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    date: {
      type: String,
      default: () =>
        new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    },
    text: {
      type: String,
      required: [true, "Review text is required"],
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "critical"],
      default: "positive",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting multiple reviews for the exact same booking
reviewSchema.index({ booking: 1 }, { unique: true, sparse: true });

// Static method to recalculate hotel rating & review count
reviewSchema.statics.calculateAverageRating = async function (hotelId) {
  const stats = await this.aggregate([
    { $match: { hotel: hotelId } },
    {
      $group: {
        _id: "$hotel",
        reviewsCount: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    const Hotel = mongoose.model("Hotel");
    if (stats.length > 0) {
      await Hotel.findByIdAndUpdate(hotelId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviews: stats[0].reviewsCount,
      });
    } else {
      await Hotel.findByIdAndUpdate(hotelId, {
        rating: 4.5,
        reviews: 0,
      });
    }
  } catch (err) {
    console.error("Error updating hotel rating stats:", err);
  }
};

// Update hotel stats after saving review
reviewSchema.post("save", function () {
  this.constructor.calculateAverageRating(this.hotel);
});

// Update hotel stats after deleting review
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.hotel);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
