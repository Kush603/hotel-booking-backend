const express = require("express");
const router = express.Router();

const Trip = require("../models/Tripschema");
const { protect } = require("../middleware/auth");

// @route   POST /api/trips
// @desc    Save an AI-generated trip or custom itinerary
// @access  Private (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      user: req.user._id,
    };

    const newTrip = await Trip.create(tripData);

    return res.status(201).json({
      success: true,
      message: "Trip itinerary saved successfully",
      trip: newTrip,
    });
  } catch (error) {
    console.error("Create Trip Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/trips/my-trips
// @desc    Get all trips saved by the authenticated user
// @access  Private (Protected)
router.get("/my-trips", protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }

    const trips = await Trip.find(filter)
      .populate("hotel", "name city images rating")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("Get Trips Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/trips/:id
// @desc    Get trip details by ID
// @access  Private (Protected)
router.get("/:id", protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate(
      "hotel",
      "name city location pricePerNight images rating"
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip itinerary not found",
      });
    }

    if (
      trip.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this trip",
      });
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error("Get Trip Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update trip itinerary details
// @access  Private (Protected)
router.put("/:id", protect, async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip itinerary not found",
      });
    }

    if (
      trip.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this trip",
      });
    }

    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Trip itinerary updated successfully",
      trip,
    });
  } catch (error) {
    console.error("Update Trip Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private (Protected)
router.delete("/:id", protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (
      trip.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this trip",
      });
    }

    await trip.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Trip itinerary deleted successfully",
    });
  } catch (error) {
    console.error("Delete Trip Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
