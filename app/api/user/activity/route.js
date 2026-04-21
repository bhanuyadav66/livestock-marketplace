import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return Response.json({ message: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) return Response.json({ message: "listingId required" }, { status: 400 });

    // Fetch the listing to learn its animalType
    const listing = await Listing.findById(listingId).select("animalType");

    // Update user: add to viewedListings (no duplicates) + update favoriteTypes signal
    const updateOps = {
      $addToSet: { viewedListings: listingId },
    };

    if (listing?.animalType) {
      updateOps.$addToSet.favoriteTypes = listing.animalType;
    }

    await User.findByIdAndUpdate(decoded.id, updateOps);

    // Increment listing views counter
    await Listing.findByIdAndUpdate(listingId, { $inc: { views: 1 } });

    return Response.json({ message: "Tracked" });
  } catch (error) {
    console.error("Activity tracking error:", error);
    return Response.json({ message: "Error" }, { status: 500 });
  }
}
