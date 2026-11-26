const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Coupon title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: {
        values: ["percentage", "flat"],
        message: "Discount type must be either 'percentage' or 'flat'",
      },
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      min: [0, "Maximum discount amount cannot be negative"],
      default: null, // Useful to cap percentage discounts (e.g. 20% up to $100)
    },
    minBookingAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum booking amount cannot be negative"],
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, "Expiry date (validUntil) is required"],
    },
    usageLimit: {
      type: Number,
      default: null, // Total global usage limit; null = unlimited
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userLimit: {
      type: Number,
      default: 1, // How many times a single user can use this coupon
      min: [1, "User limit must be at least 1"],
    },
    usersUsed: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedCount: {
          type: Number,
          default: 1,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    applicableHotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ], // Empty array means valid for all hotels
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Check if coupon is currently expired
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.validUntil;
});

// Helper Method: Validate if coupon can be applied for a specific user and booking amount
couponSchema.methods.isValidForBooking = function (userId, bookingAmount = 0) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: "This coupon is no longer active" };
  }

  if (now < this.validFrom) {
    return { valid: false, message: "This coupon is not active yet" };
  }

  if (now > this.validUntil) {
    return { valid: false, message: "This coupon has expired" };
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: "Coupon usage limit has been reached" };
  }

  if (bookingAmount < this.minBookingAmount) {
    return {
      valid: false,
      message: `Minimum booking amount of ${this.minBookingAmount} is required to apply this coupon`,
    };
  }

  if (userId) {
    const userRecord = this.usersUsed.find(
      (record) => record.user && record.user.toString() === userId.toString()
    );
    if (userRecord && userRecord.usedCount >= this.userLimit) {
      return {
        valid: false,
        message: "You have already reached the usage limit for this coupon",
      };
    }
  }

  return { valid: true, message: "Coupon is valid" };
};

// Helper Method: Calculate final discount amount based on booking subtotal
couponSchema.methods.calculateDiscount = function (bookingAmount) {
  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (bookingAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === "flat") {
    discount = Math.min(this.discountValue, bookingAmount);
  }

  return Math.round(discount * 100) / 100;
};

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
