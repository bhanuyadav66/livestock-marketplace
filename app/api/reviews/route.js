import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Listing from "@/models/Listing";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const body = await req.json();
    const { rating, comment, listing } = body;

    const listingDoc = await Listing.findById(listing);

    if (!listingDoc) {
      return Response.json({ message: "Listing not found" }, { status: 404 });
    }

    if (decoded.id === listingDoc.seller?.toString()) {
      return Response.json(
        { message: "Seller cannot rate own listing" },
        { status: 403 }
      );
    }

    const existing = await Review.findOne({
      user: decoded.id,
      listing,
    });

    if (existing) {
      return Response.json({ message: "Already rated" }, { status: 400 });
    }

    const review = await Review.create({
      rating,
      comment,
      user: decoded.id,
      listing,
    });

    const populatedReview = await Review.findById(review._id).populate("user");

    return Response.json(populatedReview);
  } catch (error) {
    console.log("REVIEW ERROR:", error);
    return Response.json(
      { message: "Error creating review" },
      { status: 500 }
    );
  }
}
