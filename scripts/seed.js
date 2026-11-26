const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const dns = require("dns");

// Ensure reliable DNS resolution for MongoDB Atlas SRV records on Windows
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

dotenv.config();

const {
  User,
  Hotel,
  Room,
  Destination,
  Coupon,
} = require("../models");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.DATABASE_URL || "mongodb://localhost:27017/SarkarHotel";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected for Seeding.");

    // Clear existing data (optional, clean slate)
    await User.deleteMany({ role: { $in: ["hotel_owner", "admin"] } });
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await Destination.deleteMany({});
    await Coupon.deleteMany({});

    console.log("🧹 Cleaned old collections.");

    // 1. Create Hotel Owner & Demo Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const owner = await User.create({
      name: "Sarkar Hospitality Group",
      email: "owner@sarkarhotels.com",
      phone: "+919876543210",
      password: passwordHash,
      role: "hotel_owner",
      avatarLabel: "SH",
    });

    console.log("👤 Hotel Owner created:", owner.email);

    // 2. Create Destinations
    const destinationsData = [
      {
        name: "Goa",
        country: "India",
        region: "West Coast",
        slug: "goa",
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85",
        description: "Sun-kissed beaches, vibrant nightlife, Portuguese architecture, and coastal tranquility.",
        shortInfo: "280+ handpicked beach resorts & private villas",
        bestTime: "Nov - Feb",
        attractions: ["Baga Beach", "Aguada Fort", "Dudhsagar Falls", "Anjuna Flea Market"],
        restaurants: ["Gunpowder", "Thalassa", "Fishermans Wharf"],
        activities: ["Scuba Diving", "Sunset Cruise", "Water Sports", "Spice Plantation Tour"],
        tags: ["popular", "trending", "recommended", "weekend"],
      },
      {
        name: "Dubai",
        country: "UAE",
        region: "Middle East",
        slug: "dubai",
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85",
        description: "Futuristic skyscrapers, world-class luxury shopping, desert safaris, and beachside glamour.",
        shortInfo: "400+ ultra-luxury hotels and suites",
        bestTime: "Oct - Apr",
        attractions: ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Dubai Marina"],
        restaurants: ["Atmosphere", "Pierchic", "Zuma"],
        activities: ["Desert Safari", "Skydiving", "Yacht Cruise", "Dune Bashing"],
        tags: ["popular", "luxury", "trending"],
      },
      {
        name: "Bali",
        country: "Indonesia",
        region: "Southeast Asia",
        slug: "bali",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85",
        description: "Lush emerald rice terraces, sacred temples, volcanic mountains, and coral reefs.",
        shortInfo: "500+ serene villas and rainforest wellness sanctuaries",
        bestTime: "Apr - Oct",
        attractions: ["Ubud Monkey Forest", "Uluwatu Temple", "Tegallalang Rice Terraces"],
        restaurants: ["Locavore", "Merah Putih", "Bebek Bengil"],
        activities: ["Surfing", "Yoga Retreats", "Volcano Trekking", "Waterfall Expeditions"],
        tags: ["trending", "recommended", "weekend"],
      },
    ];

    const destinations = await Destination.insertMany(destinationsData);
    console.log(`🌴 ${destinations.length} Destinations created.`);

    // 3. Create Sample Hotels
    const hotelsData = [
      {
        owner: owner._id,
        name: "Azure Palm Luxury Resort",
        destination: destinations[1]._id, // Dubai
        destinationSlug: "dubai",
        city: "Dubai",
        country: "UAE",
        location: "Jumeirah Beach, The Palm",
        coordinates: { latitude: 25.1124, longitude: 55.139 },
        rating: 4.9,
        reviews: 1248,
        pricePerNight: 14200,
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
        ],
        amenities: ["Wi-Fi", "Pool", "Spa", "Breakfast", "Gym", "Restaurant", "Beach Access"],
        facilities: ["24h desk", "Valet parking", "Private cabanas", "Concierge"],
        description: "An extraordinary coastal sanctuary situated on the iconic Palm Jumeirah. Enjoy panoramic Arabian Gulf views, signature fine dining, and private beach lounges.",
        category: "5 Star Hotel",
        stars: 5,
        hotelType: "Luxury Resort",
        distanceKm: 0.5,
        breakfastIncluded: true,
        freeCancellation: true,
        cancellationPolicy: "Free cancellation until 48 hours before check-in.",
        aiReviewSummary: {
          sentimentScore: 97,
          pros: ["Private Beach Access", "Impeccable Concierge", "World-class Breakfast"],
          cons: ["High weekend demand"],
          bestFor: "Couples, Luxury Seekers & Families",
        },
        priceTrend: "dropping",
      },
      {
        owner: owner._id,
        name: "The Cove Sanctuary Villa",
        destination: destinations[0]._id, // Goa
        destinationSlug: "goa",
        city: "Goa",
        country: "India",
        location: "Candolim Beach Road",
        coordinates: { latitude: 15.5178, longitude: 73.7631 },
        rating: 4.8,
        reviews: 834,
        pricePerNight: 9800,
        images: [
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
        ],
        amenities: ["Wi-Fi", "Pool", "Breakfast", "Parking", "Room Service", "Bar"],
        facilities: ["Private Plunge Pool", "Outdoor Patio", "24h Security"],
        description: "A private tropical retreat in North Goa surrounded by whispering palms. Features bespoke luxury villas with plunge pools and personal butler service.",
        category: "4 Star Hotel",
        stars: 4,
        hotelType: "Resort",
        distanceKm: 1.2,
        breakfastIncluded: true,
        freeCancellation: true,
        cancellationPolicy: "Free cancellation until 24 hours prior.",
        aiReviewSummary: {
          sentimentScore: 94,
          pros: ["Secluded Ambiance", "Private Pool", "Delicious Coastal Cuisine"],
          cons: ["Narrow access street"],
          bestFor: "Honeymooners & Peace Seekers",
        },
        priceTrend: "stable",
      },
      {
        owner: owner._id,
        name: "Arbor Grand Executive Hotel",
        destination: destinations[0]._id,
        destinationSlug: "mumbai",
        city: "Mumbai",
        country: "India",
        location: "Bandra West, Hill Road",
        coordinates: { latitude: 19.0596, longitude: 72.8295 },
        rating: 4.7,
        reviews: 2103,
        pricePerNight: 7600,
        images: [
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
        ],
        amenities: ["Wi-Fi", "Gym", "Parking", "Restaurant", "Business Center"],
        facilities: ["Airport Shuttle", "Meeting Rooms", "Rooftop Lounge"],
        description: "Situated in the beating cultural heart of Bandra, Arbor Grand balances business sophistication with boutique comforts.",
        category: "4 Star Hotel",
        stars: 4,
        hotelType: "Hotel",
        distanceKm: 0.8,
        breakfastIncluded: false,
        freeCancellation: true,
        cancellationPolicy: "Free cancellation until 24 hours prior.",
        aiReviewSummary: {
          sentimentScore: 92,
          pros: ["Prime Location", "Ultra-fast Wi-Fi", "Excellent Bar"],
          cons: ["City traffic nearby"],
          bestFor: "Business Travelers & Urban Explorers",
        },
        priceTrend: "rising",
      },
    ];

    const hotels = await Hotel.insertMany(hotelsData);
    console.log(`🏨 ${hotels.length} Hotels created.`);

    // 4. Create Rooms for Azure Palm
    const roomsData = [
      {
        hotel: hotels[0]._id,
        name: "Deluxe Ocean View Room",
        roomType: "Deluxe Room",
        bedType: "King Size Bed",
        guests: 2,
        sizeSqm: 42,
        amenities: ["Ocean View", "Complimentary Breakfast", "High-speed Wi-Fi", "Bathtub", "Balcony"],
        breakfastIncluded: true,
        freeCancellation: true,
        cancellationPolicy: "Free cancellation until 48 hours prior.",
        pricePerNight: 14200,
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85",
        totalInventory: 10,
        isAvailable: true,
      },
      {
        hotel: hotels[0]._id,
        name: "Presidential Royal Suite",
        roomType: "Presidential Suite",
        bedType: "King Size Bed",
        guests: 4,
        sizeSqm: 88,
        amenities: ["Private Jacuzzi", "24/7 Butler", "Panoramic Sea View", "Living Lounge"],
        breakfastIncluded: true,
        freeCancellation: true,
        cancellationPolicy: "Flexible cancellation.",
        pricePerNight: 28500,
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
        totalInventory: 3,
        isAvailable: true,
      },
      {
        hotel: hotels[1]._id,
        name: "Garden Standard Villa",
        roomType: "Standard Room",
        bedType: "Queen Size Bed",
        guests: 2,
        sizeSqm: 35,
        amenities: ["Private Patio", "Garden View", "Air Conditioning", "Rain Shower"],
        breakfastIncluded: true,
        freeCancellation: true,
        cancellationPolicy: "Free cancellation until 24 hours prior.",
        pricePerNight: 9800,
        image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85",
        totalInventory: 6,
        isAvailable: true,
      },
    ];

    await Room.insertMany(roomsData);
    console.log("🛏️ Rooms created.");

    // 5. Create Promotional Coupons
    const couponsData = [
      {
        code: "SUMMER20",
        title: "Summer Vacation Special",
        description: "Get 20% off up to ₹3,000 on all resort & luxury hotel bookings.",
        discountType: "percentage",
        discountValue: 20,
        maxDiscountAmount: 3000,
        minBookingAmount: 5000,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days valid
        usageLimit: 500,
        userLimit: 2,
        isActive: true,
      },
      {
        code: "WELCOME500",
        title: "New Member Welcome",
        description: "Flat ₹500 instant discount on your first hotel stay.",
        discountType: "flat",
        discountValue: 500,
        minBookingAmount: 2000,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        userLimit: 1,
        isActive: true,
      },
      {
        code: "STAYAI10",
        title: "StayAI Smart Booking",
        description: "Get 10% instant discount when you plan your trip with StayAI.",
        discountType: "percentage",
        discountValue: 10,
        maxDiscountAmount: 1500,
        minBookingAmount: 3000,
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];

    await Coupon.insertMany(couponsData);
    console.log("🎟️ Coupons created.");

    console.log("\n=================================");
    console.log("🎉 DATABASE SEEDED SUCCESSFULLY!");
    console.log("=================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
