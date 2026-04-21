import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return Response.json([]);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json([]);
    }

    // Populate the last 10 viewed listings to understand preferences
    const user = await User.findById(decoded.id)
      .populate({
        path: "viewedListings",
        select: "animalType _id",
        options: { perDocumentLimit: 10 },
      })
      .select("viewedListings favoriteTypes");

    if (!user || user.viewedListings.length === 0) {
      // Cold-start fallback: return newest popular listings
      const fallback = await Listing.find({
        $or: [{ status: "available" }, { status: { $exists: false } }],
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(6)
        .select("title price animalType images location views");

      return Response.json({ recommendations: fallback, reason: "popular" });
    }

    // Build a frequency map of viewed animal types
    const typeFreq = {};
    for (const l of user.viewedListings) {
      if (l?.animalType) {
        typeFreq[l.animalType] = (typeFreq[l.animalType] || 0) + 1;
      }
    }

    // Also factor in saved favoriteTypes signal
    for (const t of user.favoriteTypes || []) {
      typeFreq[t] = (typeFreq[t] || 0) + 0.5;
    }

    // Sort by frequency → top preferred type
    const preferredTypes = Object.entries(typeFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    const viewedIds = user.viewedListings.map((l) => l._id);

    // Fetch recommendations matching the top 2 preferred types
    const recommendations = await Listing.find({
      animalType: { $in: preferredTypes.slice(0, 2) },
      _id: { $nin: viewedIds },
      $or: [{ status: "available" }, { status: { $exists: false } }],
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(6)
      .select("title price animalType images location views");

    // Pad with popular items if we don't have 6
    let result = recommendations;
    if (result.length < 6) {
      const existingIds = [...viewedIds, ...result.map((r) => r._id)];
      const pad = await Listing.find({
        _id: { $nin: existingIds },
        $or: [{ status: "available" }, { status: { $exists: false } }],
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(6 - result.length)
        .select("title price animalType images location views");

      result = [...result, ...pad];
    }

    return Response.json({
      recommendations: result,
      preferredTypes,
      reason: "personalized",
    });
  } catch (error) {
    console.error("Personalized API error:", error);
    return Response.json([]);
  }
}
