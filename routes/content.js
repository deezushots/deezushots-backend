const express = require("express");
const Settings = require("../models/Settings");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/content — public
router.get("/", async (req, res) => {
  const settings = await Settings.findOne({ singleton: "main" });
  res.json(settings.content);
});

// PUT /api/content — protected, merges in any provided fields
router.put("/", requireAuth, async (req, res) => {
  const settings = await Settings.findOne({ singleton: "main" });
  const updates = req.body || {};

  settings.content = {
    ...settings.content.toObject(),
    ...updates,
    socials: {
      ...settings.content.socials.toObject(),
      ...(updates.socials || {}),
    },
  };

  await settings.save();
  res.json(settings.content);
});

module.exports = router;
