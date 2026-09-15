const express = require("express");
const Settings = require("../models/Settings");
const Media = require("../models/Media");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VALID_TYPES = ["photography", "videography", "documentary"];

function checkType(type, res) {
  if (!VALID_TYPES.includes(type)) {
    res.status(400).json({ error: `Type must be one of: ${VALID_TYPES.join(", ")}` });
    return false;
  }
  return true;
}

// GET /api/categories — public
router.get("/", async (req, res) => {
  const settings = await Settings.findOne({ singleton: "main" });
  res.json(settings.categories);
});

// POST /api/categories/:type  { name } — protected, add a category
router.post("/:type", requireAuth, async (req, res) => {
  const { type } = req.params;
  const { name } = req.body || {};
  if (!checkType(type, res)) return;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const settings = await Settings.findOne({ singleton: "main" });
  const list = settings.categories[type];
  if (list.some((c) => c.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: "That category already exists." });
  }
  list.push(name.trim());
  await settings.save();
  res.status(201).json(settings.categories);
});

// PUT /api/categories/:type/:index  { name } — protected, rename a category
router.put("/:type/:index", requireAuth, async (req, res) => {
  const { type, index } = req.params;
  const { name } = req.body || {};
  if (!checkType(type, res)) return;

  const settings = await Settings.findOne({ singleton: "main" });
  const list = settings.categories[type];
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= list.length) {
    return res.status(404).json({ error: "Category not found." });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const oldName = list[i];
  list[i] = name.trim();
  await settings.save();

  // Keep any media tagged with the old category name in sync.
  await Media.updateMany({ type, category: oldName }, { $set: { category: name.trim() } });

  res.json(settings.categories);
});

// DELETE /api/categories/:type/:index — protected
router.delete("/:type/:index", requireAuth, async (req, res) => {
  const { type, index } = req.params;
  if (!checkType(type, res)) return;

  const settings = await Settings.findOne({ singleton: "main" });
  const list = settings.categories[type];
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= list.length) {
    return res.status(404).json({ error: "Category not found." });
  }

  const [removed] = list.splice(i, 1);
  await settings.save();

  // Media in the deleted category falls back to "Uncategorized" rather than vanishing.
  await Media.updateMany({ type, category: removed }, { $set: { category: "Uncategorized" } });

  res.json(settings.categories);
});

module.exports = router;
