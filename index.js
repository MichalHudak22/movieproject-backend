import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./database/db.js"; // DB pool
import userRoutes from "./routes/user.routes.js"; // user router
import ratingsRoutes from "./routes/ratings.routes.js"; // ratings router
import reviewsRoutes from "./routes/reviews.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";

// Načítanie .env premenných
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// User routes
app.use("/api/auth", userRoutes);

// Ratings routes
app.use("/api/ratings", ratingsRoutes);

// Reviews routes
app.use("/api/reviews", reviewsRoutes);

// Leaderboard routes
app.use("/api/leaderboard", leaderboardRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({ status: "OK", db: "connected" });
  } catch (err) {
    console.error("❌ DB connection error:", err);
    res.status(500).json({ status: "ERROR", message: "DB connection failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await db.getConnection();
    console.log("✅ DB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }

  console.log(`✅ Backend running on port ${PORT}`);
});
