import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function GET(req, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    console.log("PARAM ID:", id);

    const listing = await Listing.findById(id).populate("seller");

    console.log("FOUND:", listing);

    if (!listing) {
      return Response.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    return Response.json(listing);
  } catch (error) {
    console.log("ERROR:", error);
    return Response.json(
      { message: "Error fetching listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, context) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const { id } = await context.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      return Response.json({ message: "Listing not found" }, { status: 404 });
    }

    if (listing.seller.toString() !== user._id.toString()) {
      return Response.json(
        { message: "You can only update your own listing" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const nextStatus = body.status === "sold" ? "sold" : "available";

    listing.status = nextStatus;
    await listing.save();

    const updatedListing = await Listing.findById(id).populate("seller");

    return Response.json(updatedListing);
  } catch (error) {
    console.log("PATCH LISTING ERROR:", error);
    return Response.json(
      { message: "Error updating listing" },
      { status: 500 }
    );
  }
}
