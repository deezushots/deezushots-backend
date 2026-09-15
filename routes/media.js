const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Media = require("../models/Media");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB, generous for short video clips
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type."));
    }
    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "deezu-shots", resource_type: "auto" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET /api/media?type=photography&category=Sports — public
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.category) filter.category = req.query.category;
  const items = await Media.find(filter).sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/media — protected, multipart form: file, type, category, title, caption
router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file was uploaded." });

    const { type, category, title, caption } = req.body || {};
    if (!["photography", "videography", "documentary"].includes(type)) {
      return res.status(400).json({ error: "Type must be photography, videography, or documentary." });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer);

      const item = await Media.create({
        type,
        category: category || "Uncategorized",
        title: title || "",
        caption: caption || "",
        url: result.secure_url,
        publicId: result.public_id,
        mediaKind: result.resource_type === "video" ? "video" : "image",
      });

      res.status(201).json(item);
    } catch (uploadErr) {
      console.error(uploadErr);
      res.status(502).json({ error: "Upload to Cloudinary failed." });
    }
  });
});

// DELETE /api/media/:id — protected
router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Media item not found." });

  try {
    await cloudinary.uploader.destroy(item.publicId, {
      resource_type: item.mediaKind === "video" ? "video" : "image",
    });
  } catch (err) {
    console.error("Cloudinary delete failed (continuing to remove the record):", err);
  }

  await item.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
