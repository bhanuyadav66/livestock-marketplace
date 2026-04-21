import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import Listing from "@/models/Listing";
import Notification from "@/models/Notification";
import User from "@/models/User";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
}

export async function GET(req) {
  try {
    await connectDB();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const favorites = await Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "listing",
        populate: {
          path: "seller",
          select: "name email rating totalRatings",
        },
      });

    return Response.json(favorites.map((favorite) => favorite.listing));
  } catch (error) {
    return Response.json(
      { message: "Error fetching favorites" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return Response.json(
        { message: "Listing ID is required" },
        { status: 400 }
      );
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return Response.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    const existing = await Favorite.findOne({ user: userId, listing: listingId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return Response.json({ favorited: false });
    }

    await Favorite.create({ user: userId, listing: listingId });

    const [listingDoc, userDoc] = await Promise.all([
      Listing.findById(listingId).populate("seller", "name"),
      User.findById(userId).select("name"),
    ]);

    if (listingDoc?.seller && listingDoc.seller._id.toString() !== userId) {
      await Notification.create({
        userId: listingDoc.seller._id,
        text: `${userDoc?.name || "Someone"} saved your listing`,
        read: false,
        type: "favorite",
        refId: listingDoc._id,
        link: `/listing/${listingDoc._id}`,
      });
    }

    return Response.json({ favorited: true });
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json({ favorited: true });
    }

    return Response.json(
      { message: "Error updating favorite" },
      { status: 500 }
    );
  }
}
