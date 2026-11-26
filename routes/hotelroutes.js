const express = require("express");
const router = express.Router();

const Hotel = require("../models/Hotelschema");
const Room = require("../models/Roomschema");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/multer");

// @route   POST /api/hotels/upload-images
// @desc    Upload hotel gallery images to Cloudinary
// @access  Private (hotel_owner, admin)
router.post(
  "/upload-images",
  protect,
  authorize("hotel_owner", "admin"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one hotel image",
        });
      }

      // Cloudinary returns each image URL in file.path
      const imageUrls = req.files.map((file) => file.path);

      return res.status(200).json({
        success: true,
        message: "Hotel images uploaded to Cloudinary successfully!",
        imageUrls,
      });
    } catch (error) {
      console.error("Hotel Image Upload Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   GET /api/hotels
// @desc    Get all hotels with search, filters (city, category, stars, price), and sorting
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      q,
      city,
      country,
      category,
      stars,
      hotelType,
      minPrice,
      maxPrice,
      amenities,
      freeCancellation,
      breakfastIncluded,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isActive: true };

    // Search query across name, city, and location
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
      ];
    }

    if (city) {
      filter.city = { $regex: `^${city}$`, $options: "i" };
    }

    if (country) {
      filter.country = { $regex: `^${country}$`, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (stars) {
      filter.stars = Number(stars);
    }

    if (hotelType) {
      filter.hotelType = hotelType;
    }

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    if (freeCancellation === "true" || freeCancellation === true) {
      filter.freeCancellation = true;
    }

    if (breakfastIncluded === "true" || breakfastIncluded === true) {
      filter.breakfastIncluded = true;
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",");
      filter.amenities = { $all: amenitiesList };
    }

    // Sorting
    let sortOptions = { rating: -1, reviews: -1 }; // default: highest rating
    if (sort === "price-asc") {
      sortOptions = { pricePerNight: 1 };
    } else if (sort === "price-desc") {
      sortOptions = { pricePerNight: -1 };
    } else if (sort === "rating") {
      sortOptions = { rating: -1 };
    } else if (sort === "distance") {
      sortOptions = { distanceKm: 1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const hotels = await Hotel.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name email phone");

    const totalHotels = await Hotel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: hotels.length,
      totalHotels,
      currentPage: Number(page),
      totalPages: Math.ceil(totalHotels / Number(limit)),
      hotels,
    });
  } catch (error) {
    console.error("Get Hotels Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/hotels/featured
// @desc    Get top featured & trending hotels
// @access  Public
router.get("/featured", async (req, res) => {
  try {
    const featuredHotels = await Hotel.find({ isActive: true, rating: { $gte: 4.5 } })
      .sort({ rating: -1, reviews: -1 })
      .limit(8);

    return res.status(200).json({
      success: true,
      count: featuredHotels.length,
      hotels: featuredHotels,
    });
  } catch (error) {
    console.error("Get Featured Hotels Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/hotels/owner/my-hotels
// @desc    Get all hotels owned by the logged-in hotel owner
// @access  Private (hotel_owner, admin)
router.get(
  "/owner/my-hotels",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const hotels = await Hotel.find({ owner: req.user._id })
        .populate("rooms")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: hotels.length,
        hotels,
      });
    } catch (error) {
      console.error("Get Owner Hotels Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   GET /api/hotels/:id
// @desc    Get single hotel by ID with rooms and reviews populated
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate("owner", "name email phone")
      .populate("destination", "name region attractions")
      .populate("rooms")
      .populate({
        path: "guestReviews",
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: { path: "user", select: "name avatarLabel" },
      });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      hotel,
    });
  } catch (error) {
    console.error("Get Hotel Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/hotels
// @desc    Create a new hotel
// @access  Private (hotel_owner, admin)
router.post(
  "/",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const hotelData = {
        ...req.body,
        owner: req.user._id,
      };

      const newHotel = await Hotel.create(hotelData);

      return res.status(201).json({
        success: true,
        message: "Hotel created successfully",
        hotel: newHotel,
      });
    } catch (error) {
      console.error("Create Hotel Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   PUT /api/hotels/:id
// @desc    Update a hotel
// @access  Private (hotel_owner, admin)
router.put(
  "/:id",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      let hotel = await Hotel.findById(req.params.id);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      // Check ownership unless admin
      if (
        hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this hotel",
        });
      }

      hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        message: "Hotel updated successfully",
        hotel,
      });
    } catch (error) {
      console.error("Update Hotel Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   DELETE /api/hotels/:id
// @desc    Delete a hotel and its associated rooms
// @access  Private (hotel_owner, admin)
router.delete(
  "/:id",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const hotel = await Hotel.findById(req.params.id);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      if (
        hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this hotel",
        });
      }

      // Delete rooms associated with this hotel
      await Room.deleteMany({ hotel: hotel._id });
      await hotel.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Hotel and associated rooms deleted successfully",
      });
    } catch (error) {
      console.error("Delete Hotel Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
