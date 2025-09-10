import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

console.log("JWT_SECRET at runtime:", process.env.JWT_SECRET);

import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"; // You had this in use but not imported
import { initializeFirebase } from "./dbConnection/connection.js";
import { errorHandler, notFound } from "./middleware/error.js";
import userRoute from "./userRoute.js";

const app = express();

app.use(cookieParser());
app.use(morgan("combined"));

app.use(
  cors({
    origin: ["http://localhost:8080", "https://your-frontend-domain.com"], // Added deployed frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRoute);

// 404 handler for unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

(async () => {
  try {
    console.log("Initializing Firebase connection...");
    await initializeFirebase();

    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);
    console.log(`Server connected to port ${PORT}!`);
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
})();
