const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Settings = require("../models/Settings");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login  { password }
router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  const settings = await Settings.findOne({ singleton: "main" });
  const match = await bcrypt.compare(password, settings.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const token = jwt.sign({ role: "owner" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

// POST /api/auth/change-password  { currentPassword, newPassword }  (protected)
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are both required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const settings = await Settings.findOne({ singleton: "main" });
  const match = await bcrypt.compare(currentPassword, settings.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  settings.passwordHash = await bcrypt.hash(newPassword, 10);
  await settings.save();
  res.json({ ok: true });
});

module.exports = router;
