const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
  type: { type: String, enum: ["photography", "videography", "documentary"], required: true },
  category: { type: String, default: "Uncategorized" },
  title: { type: String, default: "" },
  caption: { type: String, default: "" },
  url: { type: String, required: true }, // Cloudinary secure_url
  publicId: { type: String, required: true }, // Cloudinary public_id, needed to delete the file
  mediaKind: { type: String, enum: ["image", "video"], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Media", MediaSchema);
