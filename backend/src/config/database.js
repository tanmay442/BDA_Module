const mongoose = require('mongoose');

// Cache the connection promise across serverless invocations
let cachedPromise = null;

const connectDB = async () => {
  // 1. If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // 2. If a connection is already in progress, reuse the existing promise
  // This prevents race conditions under concurrent requests
  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    const opts = {
      bufferCommands: false, // Fails fast if the connection drops, rather than timing out Vercel lambdas
    };

    // Store the connection promise in our cache
    cachedPromise = mongoose.connect(process.env.MONGO_URI, opts);
    
    const conn = await cachedPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, clear the cached promise so the next request can retry
    cachedPromise = null;
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;