const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  // There is only ever one Settings document — it's the whole "site config".
  singleton: { type: String, default: "main", unique: true },

  passwordHash: { type: String, required: true },

  content: {
    brandName: { type: String, default: "Deezu Shots" },
    tagline: { type: String, default: "Kano's stories, framed frame by frame." },
    heroSubtext: { type: String, default: "" },
    bioName: { type: String, default: "Deezu" },
    bioAka: { type: String, default: "Deezu Omm" },
    bio: { type: String, default: "" },
    address: { type: String, default: "Tarauni, Kano State, Nigeria" },
    mapLink: { type: String, default: "https://maps.app.goo.gl/Kis4cLbwURPQT4Jp9" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    socials: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      threads: { type: String, default: "" },
      audiomack: { type: String, default: "" },
    },
  },

  categories: {
    photography: { type: [String], default: ["Portraits", "Events", "Sports"] },
    videography: { type: [String], default: ["Highlights", "Event Coverage", "Music Videos"] },
    documentary: { type: [String], default: ["Sports Culture", "Street Life"] },
  },
});

module.exports = mongoose.model("Settings", SettingsSchema);
