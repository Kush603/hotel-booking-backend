const express = require("express");
const router = express.Router();

const Coupon = require("../models/Couponschema");
const { protect, authorize, optionalAuth } = require("../middleware/auth");

// @route   POST /api/coupons/validate
// @desc    Validate a promo code for a given booking total
// @access  Public (Optional auth for checking user usage limits)
router.post("/validate", optionalAuth, async (req, res) => {
  try {
    const { code, bookingAmount = 0 } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive coupon code",
      });
    }

    const userId = req.user ? req.user._id : null;
    const validation = coupon.isValidForBooking(userId, Number(bookingAmount));

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const discountAmount = coupon.calculateDiscount(Number(bookingAmount));
    const finalAmount = Math.max(0, Number(bookingAmount) - discountAmount);

    return res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      originalAmount: Number(bookingAmount),
      finalAmount,
    });
  } catch (error) {
    console.error("Validate Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/coupons/active
// @desc    Get all active coupons / promotional offers
// @access  Public
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    }).select("code title description discountType discountValue minBookingAmount validUntil");

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get Active Coupons Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/coupons
// @desc    Create a new coupon code
// @access  Private (admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/coupons/:id
// @desc    Update coupon details
// @access  Private (admin)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Deactivate or delete a coupon
// @access  Private (admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await coupon.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
