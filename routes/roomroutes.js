const express = require("express");
const router = express.Router();

const Room = require("../models/Roomschema");
const Hotel = require("../models/Hotelschema");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/rooms/hotel/:hotelId
// @desc    Get all rooms for a specific hotel with filters (roomType, bedType, maxPrice, guests)
// @access  Public
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { roomType, bedType, maxPrice, guests } = req.query;

    const filter = {
      hotel: req.params.hotelId,
      isAvailable: true,
    };

    if (roomType) {
      filter.roomType = roomType;
    }

    if (bedType) {
      filter.bedType = bedType;
    }

    if (maxPrice) {
      filter.pricePerNight = { $lte: Number(maxPrice) };
    }

    if (guests) {
      filter.guests = { $gte: Number(guests) };
    }

    const rooms = await Room.find(filter).sort({ pricePerNight: 1 });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get Hotel Rooms Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room details
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "hotel",
      "name city location rating checkIn checkOut cancellationPolicy"
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get Room Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/rooms
// @desc    Add a room to a hotel
// @access  Private (hotel_owner, admin)
router.post(
  "/",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const { hotel: hotelId } = req.body;

      if (!hotelId) {
        return res.status(400).json({
          success: false,
          message: "Hotel reference is required",
        });
      }

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: "Hotel not found",
        });
      }

      // Check ownership
      if (
        hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to add rooms to this hotel",
        });
      }

      const newRoom = await Room.create(req.body);

      return res.status(201).json({
        success: true,
        message: "Room added successfully",
        room: newRoom,
      });
    } catch (error) {
      console.error("Create Room Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   PUT /api/rooms/:id
// @desc    Update room details
// @access  Private (hotel_owner, admin)
router.put(
  "/:id",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const room = await Room.findById(req.params.id).populate("hotel");

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      // Check if user is the hotel owner or admin
      if (
        room.hotel &&
        room.hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this room",
        });
      }

      const updatedRoom = await Room.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Room updated successfully",
        room: updatedRoom,
      });
    } catch (error) {
      console.error("Update Room Error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (hotel_owner, admin)
router.delete(
  "/:id",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const room = await Room.findById(req.params.id).populate("hotel");

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (
        room.hotel &&
        room.hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this room",
        });
      }

      await room.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error) {
      console.error("Delete Room Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
