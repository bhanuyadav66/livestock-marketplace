import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";

export async function GET(req, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const listings = await Listing.find({ seller: id }).sort({
      createdAt: -1,
    });

    return Response.json({ user, listings });
  } catch (error) {
    return Response.json(
      { message: "Error fetching seller profile" },
      { status: 500 }
    );
  }
}
