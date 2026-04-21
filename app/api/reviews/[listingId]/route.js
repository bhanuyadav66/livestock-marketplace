import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import User from "@/models/User";

export async function GET(req, context) {
  try {
    await connectDB();

    const { listingId } = await context.params;

    const reviews = await Review.find({ listing: listingId }).populate("user");

    return Response.json(reviews);
  } catch (error) {
    console.log("GET REVIEWS ERROR:", error);
    return Response.json(
      { message: "Error fetching reviews" },
      { status: 500 }
    );
  }
}
