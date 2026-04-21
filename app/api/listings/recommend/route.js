import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json([]);
    }

    const current = await Listing.findById(id);

    if (!current) {
      return Response.json([]);
    }

    // Primary: same animal type, excluding current listing
    // Sort by views desc so popular ones bubble up
    const recommendations = await Listing.find({
      _id: { $ne: id },
      animalType: current.animalType,
      $or: [
        { status: "available" },
        { status: { $exists: false } },
        { status: null },
      ],
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(4)
      .select("title price animalType images location views");

    // Fallback: if fewer than 4 results, pad with any other available listings
    if (recommendations.length < 4) {
      const existingIds = [id, ...recommendations.map((r) => r._id.toString())];
      const fallback = await Listing.find({
        _id: { $nin: existingIds },
        $or: [
          { status: "available" },
          { status: { $exists: false } },
          { status: null },
        ],
      })
        .sort({ views: -1, createdAt: -1 })
        .limit(4 - recommendations.length)
        .select("title price animalType images location views");

      return Response.json([...recommendations, ...fallback]);
    }

    return Response.json(recommendations);
  } catch (error) {
    console.error("Recommend API error:", error);
    return Response.json([]);
  }
}
