import mongoose from "mongoose";

const searchStatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["animalType", "location"],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

searchStatSchema.index({ type: 1, value: 1 }, { unique: true });

export default mongoose.models.SearchStat ||
  mongoose.model("SearchStat", searchStatSchema);
