import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

chatSchema.index({ listingId: 1, buyer: 1, seller: 1 }, { unique: true });
chatSchema.index({ seller: 1, updatedAt: -1 });
chatSchema.index({ buyer: 1, updatedAt: -1 });

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);
