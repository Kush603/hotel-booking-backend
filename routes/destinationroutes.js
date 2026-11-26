const express = require("express");
const router = express.Router();

const Destination = require("../models/Destinationschema");
const Hotel = require("../models/Hotelschema");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/destinations
// @desc    Get all destinations with tag filtering (popular, trending, weekend, etc.)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { tag, region, search } = req.query;
    const filter = {};

    if (tag) {
      filter.tags = tag;
    }

    if (region) {
      filter.region = { $regex: region, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { region: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const destinations = await Destination.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: destinations.length,
      destinations,
    });
  } catch (error) {
    console.error("Get Destinations Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/destinations/:idOrSlug
// @desc    Get single destination with hotels located in it
// @access  Public
router.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let destination;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      destination = await Destination.findById(idOrSlug);
    } else {
      destination = await Destination.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    const hotels = await Hotel.find({
      $or: [
        { destination: destination._id },
        { city: { $regex: destination.name, $options: "i" } },
      ],
      isActive: true,
    }).limit(10);

    return res.status(200).json({
      success: true,
      destination,
      hotels,
    });
  } catch (error) {
    console.error("Get Destination Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/destinations
// @desc    Create a new destination
// @access  Private (admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const destination = await Destination.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Destination created successfully",
      destination,
    });
  } catch (error) {
    console.error("Create Destination Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/destinations/:id
// @desc    Update a destination
// @access  Private (admin)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Destination updated successfully",
      destination,
    });
  } catch (error) {
    console.error("Update Destination Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/destinations/:id
// @desc    Delete a destination
// @access  Private (admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    await destination.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error) {
    console.error("Delete Destination Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
