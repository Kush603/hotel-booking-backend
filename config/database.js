const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // Ignore if restricted
}

mongoose.connect(process.env.DATABASE_URL);



const db = mongoose.connection;


db.on("connected", ()=>{
    console.log("MongoDB Connected Successfully");
});


db.on("error", ()=>{
    console.log("MongoDB Connection Fail");
});


db.on("disconnected", ()=>{
    console.log("MongoDB Disconnected");
});