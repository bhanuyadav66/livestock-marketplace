import { connectDB } from "@/lib/db";
import User from "@/models/User";
import SellerRating from "@/models/SellerRating";
import Notification from "@/models/Notification";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { sellerId, rating } = await req.json();

    if (!sellerId || !rating) {
      return Response.json(
        { message: "Seller ID and rating are required" },
        { status: 400 }
      );
    }

    if (decoded.id === sellerId) {
      return Response.json(
        { message: "Cannot rate yourself" },
        { status: 403 }
      );
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      return Response.json({ message: "Seller not found" }, { status: 404 });
    }

    const existingRating = await SellerRating.findOne({
      seller: sellerId,
      rater: decoded.id,
    });

    if (existingRating) {
      return Response.json(
        { message: "You have already rated this seller" },
        { status: 400 }
      );
    }

    await SellerRating.create({
      seller: sellerId,
      rater: decoded.id,
      rating: Number(rating),
    });

    await Notification.create({
      userId: sellerId,
      text: `You received a new rating of ${Number(rating)} stars`,
      read: false,
      type: "rating",
      refId: seller._id,
      link: `/user/${sellerId}`,
    });

    const ratings = await SellerRating.find({ seller: sellerId });
    const totalRatings = ratings.length;
    const averageRating =
      ratings.reduce((sum, item) => sum + item.rating, 0) / totalRatings;

    seller.rating = averageRating;
    seller.totalRatings = totalRatings;
    await seller.save();

    return Response.json({
      message: "Rated successfully",
      rating: seller.rating,
      totalRatings: seller.totalRatings,
    });
  } catch (error) {
    return Response.json(
      { message: "Error rating seller" },
      { status: 500 }
    );
  }
}
