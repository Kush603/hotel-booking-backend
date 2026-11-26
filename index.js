const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Connect to MongoDB
require("./config/database");

// Import Routes
const userRoutes = require("./routes/userroutes");
const hotelRoutes = require("./routes/hotelroutes");
const roomRoutes = require("./routes/roomroutes");
const bookingRoutes = require("./routes/bookingroutes");
const destinationRoutes = require("./routes/destinationroutes");
const reviewRoutes = require("./routes/reviewroutes");
const couponRoutes = require("./routes/couponroutes");
const tripRoutes = require("./routes/triproutes");
const notificationRoutes = require("./routes/notificationroutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Root Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "StayAI Hotel Booking API is live and running 🚀",
    endpoints: {
      users: "/api/users",
      hotels: "/api/hotels",
      rooms: "/api/rooms",
      bookings: "/api/bookings",
      destinations: "/api/destinations",
      reviews: "/api/reviews",
      coupons: "/api/coupons",
      trips: "/api/trips",
      notifications: "/api/notifications",
    },
  });
});

// API Routes (Supports both with /api and direct endpoints)
app.use("/api/users", userRoutes);
app.use("/users", userRoutes);
app.use("/user", userRoutes);

app.use("/api/hotels", hotelRoutes);
app.use("/hotels", hotelRoutes);

app.use("/api/rooms", roomRoutes);
app.use("/rooms", roomRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/bookings", bookingRoutes);

app.use("/api/destinations", destinationRoutes);
app.use("/destinations", destinationRoutes);

app.use("/api/reviews", reviewRoutes);
app.use("/reviews", reviewRoutes);

app.use("/api/coupons", couponRoutes);
app.use("/coupons", couponRoutes);

app.use("/api/trips", tripRoutes);
app.use("/trips", tripRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;