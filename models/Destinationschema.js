const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Destination name is required"],
      unique: true,
      trim: true,
      maxlength: [80, "Destination name cannot exceed 80 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    region: {
      type: String,
      required: [true, "Region is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Destination image URL is required"],
    },
    shortInfo: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Destination description is required"],
      trim: true,
    },
    bestTime: {
      type: String,
      trim: true,
      default: "",
    },
    attractions: {
      type: [String],
      default: [],
    },
    restaurants: {
      type: [String],
      default: [],
    },
    activities: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      enum: {
        values: ["popular", "trending", "recommended", "budget", "luxury", "weekend"],
        message: "{VALUE} is not a valid destination tag",
      },
      default: ["popular"],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all hotels belonging to this destination
destinationSchema.virtual("hotels", {
  ref: "Hotel",
  localField: "_id",
  foreignField: "destination",
});

destinationSchema.index({ tags: 1 });
destinationSchema.index({ name: "text", country: "text", region: "text" });

const Destination = mongoose.model("Destination", destinationSchema);

module.exports = Destination;
