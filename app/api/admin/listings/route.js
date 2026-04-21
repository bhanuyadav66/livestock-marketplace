import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const listings = await Listing.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("seller", "name email");

  return Response.json({ listings });
}
