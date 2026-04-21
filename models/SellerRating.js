import mongoose from "mongoose";

const sellerRatingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

sellerRatingSchema.index({ seller: 1, rater: 1 }, { unique: true });

export default mongoose.models.SellerRating ||
  mongoose.model("SellerRating", sellerRatingSchema);
