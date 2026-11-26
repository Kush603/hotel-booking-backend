const express = require("express");
const router = express.Router();

const Booking = require("../models/Bookingschema");
const Hotel = require("../models/Hotelschema");
const Room = require("../models/Roomschema");
const Coupon = require("../models/Couponschema");
const Notification = require("../models/Notificationschema");
const { protect, authorize } = require("../middleware/auth");

// @route   POST /api/bookings
// @desc    Create a new hotel booking
// @access  Private (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const {
      hotel: hotelId,
      room: roomId,
      checkIn,
      checkOut,
      nights = 1,
      guests = 1,
      roomsCount = 1,
      guestName,
      email,
      phone,
      specialRequests = "",
      paymentMethod = "Card",
      couponCode,
    } = req.body;

    if (!hotelId || !roomId || !checkIn || !checkOut || !guestName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking details",
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Pricing calculation
    const baseRoomPrice = room.pricePerNight || hotel.pricePerNight;
    const roomTotal = baseRoomPrice * Number(nights) * Number(roomsCount);
    const taxes = Math.round(roomTotal * 0.12); // 12% standard GST/Tax
    const serviceFee = 499;

    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        const validation = coupon.isValidForBooking(req.user._id, roomTotal);
        if (validation.valid) {
          discount = coupon.calculateDiscount(roomTotal);
          appliedCoupon = coupon;

          // Record usage
          coupon.usedCount += 1;
          const userUsage = coupon.usersUsed.find(
            (u) => u.user && u.user.toString() === req.user._id.toString()
          );
          if (userUsage) {
            userUsage.usedCount += 1;
            userUsage.lastUsedAt = new Date();
          } else {
            coupon.usersUsed.push({
              user: req.user._id,
              usedCount: 1,
              lastUsedAt: new Date(),
            });
          }
          await coupon.save();
        }
      }
    }

    const finalTotal = Math.max(0, roomTotal + taxes + serviceFee - discount);

    const newBooking = await Booking.create({
      user: req.user._id,
      hotel: hotel._id,
      room: room._id,
      hotelName: hotel.name,
      location: `${hotel.location}, ${hotel.city}`,
      image: room.image || hotel.images[0] || "",
      roomName: room.name,
      roomType: room.roomType || "Deluxe Room",
      bedType: room.bedType || "Queen Size Bed",
      checkIn,
      checkOut,
      nights: Number(nights),
      guests: Number(guests),
      roomsCount: Number(roomsCount),
      guestName,
      email,
      phone,
      specialRequests,
      roomTotal,
      taxes,
      serviceFee,
      total: finalTotal,
      currency: "INR",
      payment: {
        method: paymentMethod,
        status: "paid",
        paidAt: new Date(),
      },
      status: "upcoming",
      cancellationPolicy: room.cancellationPolicy || hotel.cancellationPolicy,
    });

    // Create confirmation notification for the user
    await Notification.create({
      user: req.user._id,
      title: "Booking Confirmed! 🎉",
      copy: `Your reservation at ${hotel.name} (${newBooking.reference}) is confirmed. Check-in: ${checkIn}.`,
      type: "booking",
      meta: {
        bookingId: newBooking._id,
        reference: newBooking.reference,
        hotelName: hotel.name,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      discountApplied: discount,
      booking: newBooking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get all bookings of the authenticated user
// @access  Private (Protected)
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate("hotel", "name city images rating amenities cancellationPolicy")
      .populate("room", "name roomType bedType amenities")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get My Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking details with digital pass
// @access  Private (Protected)
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel")
      .populate("room");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Ensure only the user or admin or hotel owner can access
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel an existing booking
// @access  Private (Protected)
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const { reason = "User requested cancellation" } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.payment.status = "refunded";

    await booking.save();

    // Create notification
    await Notification.create({
      user: req.user._id,
      title: "Booking Cancelled",
      copy: `Your reservation at ${booking.hotelName} (${booking.reference}) has been cancelled.`,
      type: "booking",
      meta: {
        bookingId: booking._id,
        reference: booking.reference,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/bookings/hotel/:hotelId
// @desc    Get all bookings for a hotel (for hotel owner dashboard)
// @access  Private (hotel_owner, admin)
router.get(
  "/hotel/:hotelId",
  protect,
  authorize("hotel_owner", "admin"),
  async (req, res) => {
    try {
      const hotel = await Hotel.findById(req.params.hotelId);
      if (!hotel) {
        return res.status(404).json({ success: false, message: "Hotel not found" });
      }

      if (
        hotel.owner.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view bookings for this hotel",
        });
      }

      const bookings = await Booking.find({ hotel: req.params.hotelId })
        .populate("user", "name email phone")
        .sort({ checkIn: 1 });

      return res.status(200).json({
        success: true,
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      console.error("Get Hotel Bookings Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
