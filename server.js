require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Settings = require("./models/Settings");

const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");
const categoryRoutes = require("./routes/categories");
const mediaRoutes = require("./routes/media");

const PORT = process.env.PORT || 4000;
const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "DeezuShots2026";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in the environment. Add it to .env (or Render's Environment tab) and restart.");
  process.exit(1);
}

// Allow one or more frontend origins (comma-separated) via env, e.g.
// FRONTEND_URL="https://myusername.github.io,http://localhost:5500"
const allowedOrigins = (process.env.FRONTEND_URL || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/media", mediaRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

async function ensureSettings() {
  let settings = await Settings.findOne({ singleton: "main" });
  if (!settings) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    settings = await Settings.create({ singleton: "main", passwordHash });
    console.log("──────────────────────────────────────────────────────────");
    console.log(" No settings found — created defaults with a fresh admin password.");
    console.log(` Default admin password: ${DEFAULT_PASSWORD}`);
    console.log(" Log in and change it immediately from the dashboard.");
    console.log("──────────────────────────────────────────────────────────");
  }
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    await ensureSettings();
    app.listen(PORT, () => console.log(`Deezu Shots API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });
