const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const path = require("path");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const {
  User,
  Hotel,
  Room,
  Destination,
  Coupon,
} = require("../models");

const destinationsData = require("C:/Users/Acer/Desktop/Hotelbookingapp/scripts/destinations_temp.json");

const photo = (id, sig) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80&sig=${sig}`;

const seedGlobalDatabase = async () => {
  try {
    const mongoUri =
      process.env.DATABASE_URL ||
      "mongodb+srv://darkgray802_db_user:dKe8Q3ygTXzidPtM@cluster0.bf0cde0.mongodb.net/SarkarHotel?retryWrites=true&w=majority";

    console.log("Connecting to MongoDB Atlas:", mongoUri.split("@")[1]);
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Atlas Connected Successfully!");

    // Clean old collections
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    await Destination.deleteMany({});

    console.log("🧹 Cleaned old hotel and destination collections.");

    // Ensure Owner
    let owner = await User.findOne({ email: "owner@sarkarhotels.com" });
    if (!owner) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("password123", salt);
      owner = await User.create({
        name: "Sarkar Hospitality Group",
        email: "owner@sarkarhotels.com",
        phone: "+919876543210",
        password: passwordHash,
        role: "hotel_owner",
        avatarLabel: "SH",
      });
      console.log("👤 Created Partner Owner:", owner.email);
    }

    // Insert Destinations with sanitized enum tags
    const allowedTags = ["popular", "trending", "recommended", "budget", "luxury", "weekend"];
    const insertedDestinations = await Destination.insertMany(
      destinationsData.map((d) => {
        const cleanTags = (d.tags || []).filter((t) => allowedTags.includes(t));
        return {
          name: d.name,
          country: d.country,
          region: d.region,
          slug: d.id,
          image: d.image,
          description: d.description,
          shortInfo: d.shortInfo,
          bestTime: d.bestTime,
          attractions: d.attractions,
          restaurants: d.restaurants,
          activities: d.activities,
          tags: cleanTags.length > 0 ? cleanTags : ["popular"],
        };
      })
    );
    console.log(`🌴 Inserted ${insertedDestinations.length} Global Destinations!`);

    // Map destinations by slug
    const destMap = {};
    insertedDestinations.forEach((d) => {
      destMap[d.slug] = d._id;
    });

    // Read full hotel catalog from frontend catalog script data
    // We can require the HOTELS from data/catalog or construct it
    const catalogHotels = [
      // Goa
      {
        name: "The Leela Goa Resort & Spa",
        destinationSlug: "goa",
        city: "Goa",
        country: "India",
        location: "Mobor Beach, Cavelossim, South Goa",
        pricePerNight: 240,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1582719478250-c89cae4dc85b", "leela1"),
          photo("photo-1566073771259-6a8506099945", "leela2"),
        ],
        description: "Set amidst 75 acres of landscaped lagoons and Mobor beach. Portuguese heritage with Vijayanagara palace opulence.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop", "24/7 Room Service"],
        facilities: ["24/7 Front Desk", "Infinity Pool", "Private Beach", "Ayurvedic Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Mobor Beach", "Cabo de Rama Fort", "Cavelossim River Cruise"],
          famousFoods: ["Goan Fish Curry Thali", "Bebinca", "Prawn Balchão"],
          localTips: "Book the private lagoon terrace suite for uninterrupted sunset views and dawn yoga.",
        },
      },
      {
        name: "Taj Exotica Resort & Spa Benaulim",
        destinationSlug: "goa",
        city: "Goa",
        country: "India",
        location: "Calwaddo, Benaulim, South Goa",
        pricePerNight: 280,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1571896349842-33c89424de2d", "tajex1"),
          photo("photo-1590490360182-c33d57733427", "tajex2"),
        ],
        description: "Mediterranean-style coastal sanctuary overlooking the Arabian Sea with private plunge pools, Jiva wellness spa, and beachfront cabanas.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Jiva Spa", "Private Cabanas", "Tennis Court"],
        stayAILocalGuide: {
          nearbyAttractions: ["Benaulim Beach", "Colva Beach Promenade", "Margao Old Portuguese Quarters"],
          famousFoods: ["Rawa Fried Kingfish", "Crab Xec Xec", "Goan Pork Vindaloo"],
          localTips: "Take the complimentary sunset bike tour along the tranquil Benaulim coastline.",
        },
      },
      {
        name: "W Goa Vagator Beach",
        destinationSlug: "goa",
        city: "Goa",
        country: "India",
        location: "Vagator Beach, North Goa",
        pricePerNight: 260,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1542314831-068cd1dbfeeb", "wgoa1"),
          photo("photo-1578683010236-d716f9a3f461", "wgoa2"),
        ],
        description: "Electrifying luxury resort carved into the cliffs of Vagator beach beneath Chapora Fort. Vibrant Rockpool sunset parties and AWAY Spa treatments.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop"],
        facilities: ["Rockpool Deck", "AWAY Spa", "FIT Gym"],
        stayAILocalGuide: {
          nearbyAttractions: ["Chapora Fort", "Vagator Beach", "Anjuna Flea Market"],
          famousFoods: ["Cocktail Shacks Seafood", "Truffle Poi Bread", "Lobster Peri-Peri"],
          localTips: "The Rockpool deck is the prime sunset and electronic music spot in North Goa.",
        },
      },
      // Delhi
      {
        name: "The Imperial New Delhi",
        destinationSlug: "delhi",
        city: "Delhi",
        country: "India",
        location: "Janpath, Connaught Place, New Delhi",
        pricePerNight: 290,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1566073771259-6a8506099945", "imperial1"),
          photo("photo-1582719478250-c89cae4dc85b", "imperial2"),
        ],
        description: "Iconic 1930s colonial landmark hotel on Janpath. Filled with British raj art collections, high-ceilinged teakwood suites, and the legendary 1911 Bar.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Art Gallery", "1911 Bar", "Imperial Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Connaught Place", "India Gate", "National Museum", "Rashtrapati Bhavan"],
          famousFoods: ["Imperial High Tea", "Mughlai Galouti Kebab", "Old Delhi Butter Chicken"],
          localTips: "Take the private morning museum walk inside the hotel corridors with the resident curator.",
        },
      },
      {
        name: "The Oberoi New Delhi",
        destinationSlug: "delhi",
        city: "Delhi",
        country: "India",
        location: "Dr Zakir Hussain Marg, Golf Links, New Delhi",
        pricePerNight: 350,
        category: "Luxury Resort",
        hotelType: "Hotel",
        images: [
          photo("photo-1571896349842-33c89424de2d", "oberoidel1"),
          photo("photo-1590490360182-c33d57733427", "oberoidel2"),
        ],
        description: "Ultra-luxury modern hotel overlooking the lush Delhi Golf Course and Humayun’s Tomb. Clean air filtration systems and rooftop restaurant Cirrus9.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop"],
        facilities: ["Cirrus9 Rooftop", "Indoor Pool", "Business Lounge"],
        stayAILocalGuide: {
          nearbyAttractions: ["Humayun’s Tomb", "Delhi Golf Club", "Khan Market"],
          famousFoods: ["Peking Duck at Baoshuan", "Dum Pukht Biryani", "Artisan Coffee"],
          localTips: "Book an evening cocktail at Cirrus9 for twilight views over Humayun’s Tomb dome.",
        },
      },
      // Mumbai
      {
        name: "The Taj Mahal Palace Mumbai",
        destinationSlug: "mumbai",
        city: "Mumbai",
        country: "India",
        location: "Apollo Bunder, Colaba, Mumbai",
        pricePerNight: 390,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1566073771259-6a8506099945", "tajpalace1"),
          photo("photo-1582719478250-c89cae4dc85b", "tajpalace2"),
        ],
        description: "India’s most celebrated heritage hotel since 1903, directly overlooking the Gateway of India. Opulent Moorish arches, floating sea view suites, and Wasabi by Morimoto.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "24/7 Room Service"],
        facilities: ["Wasabi by Morimoto", "Sea Lounge", "Jiva Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Gateway of India", "Colaba Causeway Bazaar", "Jehangir Art Gallery"],
          famousFoods: ["Wasabi White Fish Carpaccio", "Sea Lounge Afternoon Scones", "Bombay Duck Fry"],
          localTips: "Book sea-facing palace wing rooms for morning views of fishing boats sailing past the Gateway.",
        },
      },
      // Jaipur
      {
        name: "Rambagh Palace Jaipur",
        destinationSlug: "jaipur",
        city: "Jaipur",
        country: "India",
        location: "Bhawani Singh Road, Jaipur, Rajasthan",
        pricePerNight: 580,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1566073771259-6a8506099945", "rambagh1"),
          photo("photo-1582719478250-c89cae4dc85b", "rambagh2"),
        ],
        description: "Former residence of the Maharaja of Jaipur set in 47 acres of Mughal gardens with strutting peacocks, marble suites, and Suvarna Mahal dining.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop"],
        facilities: ["Suvarna Mahal", "Polo Bar", "Jiva Grande Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["City Palace Jaipur", "Hawa Mahal", "Albert Hall Museum"],
          famousFoods: ["Royal Rajasthani Lal Maas", "Dal Baati Churma", "Ghevar"],
          localTips: "Dine under golden crystal chandeliers at Suvarna Mahal, served on genuine silver tableware.",
        },
      },
      // Dubai
      {
        name: "Burj Al Arab Jumeirah",
        destinationSlug: "dubai",
        city: "Dubai",
        country: "UAE",
        location: "Jumeirah Beach Road, Umm Suqeim, Dubai",
        pricePerNight: 1250,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1512453979798-5ea266f8880c", "burj1"),
          photo("photo-1582719478250-c89cae4dc85b", "burj2"),
        ],
        description: "The world-famous sail-shaped icon of modern luxury. All-duplex suites with 24-karat gold interiors, private helipad, and Sal infinity pool club.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop", "24/7 Room Service"],
        facilities: ["Private Helipad", "Sal Infinity Pool", "Talise Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Souk Madinat Jumeirah", "Wild Wadi Waterpark", "Kite Beach Dubai"],
          famousFoods: ["Gold Leaf Cappuccino", "Al Mahara Seafood", "Arabic Mezze"],
          localTips: "Book an afternoon cabana at the private overwater terrace deck for panoramic Gulf views.",
        },
      },
      {
        name: "Atlantis The Royal Palm",
        destinationSlug: "dubai",
        city: "Dubai",
        country: "UAE",
        location: "Crescent Road, Palm Jumeirah, Dubai",
        pricePerNight: 890,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1580674684081-7617fbf3d745", "atlantisroyal1"),
          photo("photo-1540541338287-41700207dee6", "atlantisroyal2"),
        ],
        description: "Ultra-luxury cantilevered architectural triumph on the Palm. Cloud 22 sky pool, celebrity chef restaurants (Nobu, Heston Blumenthal), and fire-breathing fountains.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Cloud 22 Sky Pool", "Aquaventure Access", "Awaken Wellness"],
        stayAILocalGuide: {
          nearbyAttractions: ["Palm Jumeirah Boardwalk", "Aquaventure Waterpark", "The View at The Palm"],
          famousFoods: ["Heston Blumenthal Meat Fruit", "Nobu Wagyu Tacos", "Peruvian Ceviche"],
          localTips: "Sunset at Cloud 22 infinity pool 90 meters high in the sky is the ultimate Dubai moment.",
        },
      },
      // New York
      {
        name: "The Plaza Hotel New York",
        destinationSlug: "nyc",
        city: "New York",
        country: "USA",
        location: "Fifth Avenue at Central Park South, New York, NY",
        pricePerNight: 680,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1496442226666-8d4d0e62e6e9", "plaza1"),
          photo("photo-1566073771259-6a8506099945", "plaza2"),
        ],
        description: "New York’s most storied Fifth Avenue landmark directly at Central Park South. The Palm Court stained-glass dome, Guerlain Spa, and 24-karat gold fixtures.",
        amenities: ["Wi-Fi", "Breakfast", "Spa", "Gym", "Concierge", "24/7 Room Service"],
        facilities: ["The Palm Court", "Guerlain Spa", "Champagne Bar"],
        stayAILocalGuide: {
          nearbyAttractions: ["Central Park", "Fifth Avenue Shopping", "MoMA", "Carnegie Hall"],
          famousFoods: ["Palm Court Afternoon Tea", "Plaza Club Sandwich", "New York Cheesecake"],
          localTips: "Order afternoon tea in the Palm Court under the original 1907 stained-glass dome.",
        },
      },
      // London
      {
        name: "The Ritz London",
        destinationSlug: "london",
        city: "London",
        country: "UK",
        location: "150 Piccadilly, St. James’s, London",
        pricePerNight: 720,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1513635269975-59663e0ac1ad", "ritzlon1"),
          photo("photo-1566073771259-6a8506099945", "ritzlon2"),
        ],
        description: "The epitome of British grandeur overlooking Green Park. Neoclassical Louis XVI interiors, two-Michelin-starred dining, and legendary Palm Court afternoon tea.",
        amenities: ["Wi-Fi", "Breakfast", "Spa", "Gym", "Concierge", "24/7 Room Service"],
        facilities: ["The Ritz Restaurant", "Palm Court", "Rivoli Bar"],
        stayAILocalGuide: {
          nearbyAttractions: ["Buckingham Palace", "Green Park", "Piccadilly Circus"],
          famousFoods: ["Ritz Traditional Afternoon Tea", "Beef Wellington with Truffle Jus", "Crepes Suzette"],
          localTips: "Jackets and ties are required for gentlemen in the Ritz restaurant and afternoon tea.",
        },
      },
      // Paris
      {
        name: "Hôtel Plaza Athénée Paris",
        destinationSlug: "paris",
        city: "Paris",
        country: "France",
        location: "25 Avenue Montaigne, 8th arr., Paris",
        pricePerNight: 980,
        category: "Heritage Hotel",
        hotelType: "Heritage",
        images: [
          photo("photo-1502602898657-3e91760cbb34", "ath1"),
          photo("photo-1566073771259-6a8506099945", "ath2"),
        ],
        description: "Haute couture palace on Avenue Montaigne with signature red geraniums on balconies, Dior Spa, ice rink in winter courtyard, and Eiffel Tower views.",
        amenities: ["Wi-Fi", "Breakfast", "Spa", "Gym", "Concierge", "24/7 Room Service"],
        facilities: ["Dior Spa", "Courtyard Garden", "Jean Imbert Restaurant"],
        stayAILocalGuide: {
          nearbyAttractions: ["Champs-Élysées", "Arc de Triomphe", "Grand Palais"],
          famousFoods: ["Jean Imbert French Classics", "Croissants with Salted Butter", "Macarons"],
          localTips: "Book an Eiffel Tower balcony suite for an unobstructed view of the sparkling light show.",
        },
      },
      // Maldives
      {
        name: "One&Only Reethi Rah Maldives",
        destinationSlug: "maldives",
        city: "Maldives",
        country: "Maldives",
        location: "North Malé Atoll, Maldives",
        pricePerNight: 1400,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1514282401047-d79a71a590e8", "reethi1"),
          photo("photo-1582719478250-c89cae4dc85b", "reethi2"),
        ],
        description: "Sprawled across 12 pristine beaches and 6 km of coastline. Palatial overwater villas with catamaran nets suspended over turquoise waters.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop"],
        facilities: ["Overwater Spa", "12 Private Beaches", "Dive Center"],
        stayAILocalGuide: {
          nearbyAttractions: ["North Malé Coral Reef", "Private Sandbank Lagoon", "Reethi Turtle Sanctuary"],
          famousFoods: ["Maldivian Tuna Curry", "Grilled Reef Fish", "Fresh Coconut Water"],
          localTips: "Cycle your villa’s bicycles along the palm-shaded sandy trails connecting all 12 private beaches.",
        },
      },
      // Bali
      {
        name: "Four Seasons Resort Bali at Sayan",
        destinationSlug: "ubud",
        city: "Ubud",
        country: "Indonesia",
        location: "Sayan, Ubud, Gianyar, Bali",
        pricePerNight: 720,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1537996194471-e657df975ab4", "fssayan1"),
          photo("photo-1566073771259-6a8506099945", "fssayan2"),
        ],
        description: "Voted World’s Best Hotel. Entered via an elliptical rooftop lotus pond suspended above the Ayung River valley. Private plunge pools wrapped in jungle canopy.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Sacred River Spa", "Riverside Dining", "Yoga Pavilion"],
        stayAILocalGuide: {
          nearbyAttractions: ["Ayung River Rafting", "Sayan Ridge Walk", "Tegallalang Rice Terraces"],
          famousFoods: ["Babi Guling", "Ayung Riverside Nasi Campur", "Green Coconut Elixir"],
          localTips: "Experience the Sacred Nap in a silk hammock suspended over rice paddies listening to river sounds.",
        },
      },
      // Sydney
      {
        name: "Park Hyatt Sydney",
        destinationSlug: "sydney",
        city: "Sydney",
        country: "Australia",
        location: "7 Hickson Rd, The Rocks, Sydney, NSW",
        pricePerNight: 780,
        category: "Luxury Resort",
        hotelType: "Hotel",
        images: [
          photo("photo-1506973035872-a4ec16b8e8d9", "parksyd1"),
          photo("photo-1566073771259-6a8506099945", "parksyd2"),
        ],
        description: "Unrivaled waterfront address nestled directly beneath the Sydney Harbour Bridge facing the Sydney Opera House across the water. Rooftop pool and personal butler.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Rooftop Pool", "The Dining Room", "Spa & Wellness"],
        stayAILocalGuide: {
          nearbyAttractions: ["Sydney Opera House", "Harbour Bridge Walk", "The Rocks"],
          famousFoods: ["The Dining Room Oysters", "Australian Wagyu Tenderloin", "Pavlova"],
          localTips: "Wake up at 6:00 AM to watch the sun rise directly behind the Sydney Opera House sails from your balcony.",
        },
      },
      // Qatar
      {
        name: "The St. Regis Doha",
        destinationSlug: "doha",
        city: "Doha",
        country: "Qatar",
        location: "Doha West Bay, Katara Cultural Village, Doha",
        pricePerNight: 390,
        category: "Luxury Resort",
        hotelType: "Resort",
        images: [
          photo("photo-1568084680786-a84f91d1153c", "stregisdoha1"),
          photo("photo-1566073771259-6a8506099945", "stregisdoha2"),
        ],
        description: "Arabian palace architecture featuring an Olympic-size pool overlooking the Arabian Gulf, private cabanas, Remède Spa, and signature St. Regis Butler service.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge", "Free Airport Pickup & Drop"],
        facilities: ["Olympic Pool", "Private Beach", "Remède Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Katara Cultural Village", "The Pearl-Qatar", "Museum of Islamic Art"],
          famousFoods: ["Spice Market Southeast Asian Delights", "Qatari Machboos Lamb", "Baklava"],
          localTips: "Walk through the private tunnel directly into Katara Cultural Village for evening art and theater.",
        },
      },
      // Cape Town
      {
        name: "The Silo Hotel Cape Town",
        destinationSlug: "cape-town",
        city: "Cape Town",
        country: "South Africa",
        location: "Silo Square, V&A Waterfront, Cape Town",
        pricePerNight: 850,
        category: "Boutique Hotel",
        hotelType: "Boutique",
        images: [
          photo("photo-1580618672591-eb180b1a973f", "silo1"),
          photo("photo-1540541338287-41700207dee6", "silo2"),
        ],
        description: "Masterpiece built in the grain elevator portion of a historic grain silo above Zeitz MOCAA museum. Pillowed geometric glass windows and rooftop pool overlooking Table Mountain.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Rooftop Glass Pool", "The Granary Cafe", "The Silo Spa"],
        stayAILocalGuide: {
          nearbyAttractions: ["Table Mountain", "V&A Waterfront", "Zeitz MOCAA Museum"],
          famousFoods: ["Karoo Lamb Loin", "Cape Malay Spiced Seafood", "Pinotage Wine"],
          localTips: "The rooftop bar offers Cape Town’s most dramatic 360-degree sunset view of Table Mountain and harbor.",
        },
      },
      // Nigeria
      {
        name: "The Wheatbaker Hotel Ikoyi",
        destinationSlug: "lagos",
        city: "Lagos",
        country: "Nigeria",
        location: "4 Onitolo Rd, Ikoyi, Lagos",
        pricePerNight: 260,
        category: "Boutique Hotel",
        hotelType: "Boutique",
        images: [
          photo("photo-1618828665011-0abd973f7bb8", "wheatbaker1"),
          photo("photo-1582719478250-c89cae4dc85b", "wheatbaker2"),
        ],
        description: "Lagos’s premier luxury boutique sanctuary situated in serene residential Ikoyi. Showcases curated Nigerian modern art exhibitions, wellness spa, and grill restaurant.",
        amenities: ["Wi-Fi", "Breakfast", "Pool", "Spa", "Gym", "Concierge"],
        facilities: ["Art Lounge", "Outdoor Pool", "The Grill Room"],
        stayAILocalGuide: {
          nearbyAttractions: ["Lekki Conservation Centre", "Nike Art Gallery", "Tarkwa Bay Beach"],
          famousFoods: ["Nigerian Jollof Rice with Grilled Fish", "Suya Skewers", "Plantain Dodo"],
          localTips: "The quiet garden poolside terrace is ideal for private business meetings and evening unwinding in Lagos.",
        },
      },
    ];

    for (const h of catalogHotels) {
      const destId = destMap[h.destinationSlug];
      const createdHotel = await Hotel.create({
        owner: owner._id,
        name: h.name,
        destination: destId,
        destinationSlug: h.destinationSlug,
        city: h.city,
        country: h.country,
        location: h.location,
        pricePerNight: h.pricePerNight,
        category: h.category || "Luxury Resort",
        hotelType: h.hotelType || "Resort",
        images: h.images,
        amenities: h.amenities,
        facilities: h.facilities,
        description: h.description,
        rating: 4.9,
        reviews: 240,
        breakfastIncluded: true,
        freeCancellation: true,
        stayAILocalGuide: h.stayAILocalGuide,
      });

      // Create rooms for each hotel with valid enum types
      await Room.create([
        {
          hotel: createdHotel._id,
          name: "Deluxe King Room",
          roomType: "Deluxe Room",
          bedType: "King Size Bed",
          guests: 2,
          pricePerNight: h.pricePerNight,
          sizeSqm: 38,
          amenities: ["Wi-Fi", "Breakfast", "Rain Shower", "Work Desk"],
          breakfastIncluded: true,
          freeCancellation: true,
          image: h.images[0],
        },
        {
          hotel: createdHotel._id,
          name: "Executive Ocean/Skyline Suite",
          roomType: "Executive Suite",
          bedType: "King Size Bed",
          guests: 3,
          pricePerNight: Math.round(h.pricePerNight * 1.45),
          sizeSqm: 56,
          amenities: ["Lounge Access", "Butler Service", "Deep Soak Tub"],
          breakfastIncluded: true,
          freeCancellation: true,
          image: h.images[1] || h.images[0],
        },
      ]);
    }

    console.log(`🏨 Successfully seeded ${catalogHotels.length} Global Hotels with Rooms!`);

    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed. All global data is LIVE!");
  } catch (error) {
    console.error("❌ Seed Global Error:", error);
    process.exit(1);
  }
};

seedGlobalDatabase();
