const express = require("express");
const router = express.Router();

const Review = require("../models/Reviewschema");
const Hotel = require("../models/Hotelschema");
const { protect } = require("../middleware/auth");

// @route   GET /api/reviews/hotel/:hotelId
// @desc    Get all reviews for a specific hotel
// @access  Public
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ hotel: req.params.hotelId })
      .populate("user", "name avatarLabel")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalReviews = await Review.countDocuments({
      hotel: req.params.hotelId,
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      totalReviews,
      currentPage: Number(page),
      totalPages: Math.ceil(totalReviews / Number(limit)),
      reviews,
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/reviews
// @desc    Add a new review for a hotel (Rating is auto-recalculated on Hotel)
// @access  Private (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const { hotel: hotelId, rating, text, booking: bookingId } = req.body;

    if (!hotelId || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: "Hotel reference, rating (1-5), and review text are required",
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Determine sentiment score loosely based on rating
    let sentiment = "neutral";
    if (rating >= 4) sentiment = "positive";
    else if (rating <= 2) sentiment = "negative";

    const newReview = await Review.create({
      hotel: hotelId,
      user: req.user._id,
      booking: bookingId || null,
      author: req.user.name,
      rating: Number(rating),
      text,
      sentiment,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Create Review Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review (Rating is auto-recalculated on Hotel)
// @access  Private (Protected)
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Only the author or an admin can delete the review
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
