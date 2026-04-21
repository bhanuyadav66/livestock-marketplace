import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    animalType: {
      type: String,
      enum: ["buffalo", "goat", "sheep", "cow", "poultry"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
    images: [
      {
        type: String, // Cloudinary URLs
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
      address: String,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Required for MongoDB $near / geospatial queries
listingSchema.index({ location: "2dsphere" });

export default mongoose.models.Listing || mongoose.model("Listing", listingSchema);
