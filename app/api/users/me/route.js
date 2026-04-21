import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
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

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const listings = await Listing.find({ seller: user._id }).sort({
      createdAt: -1,
    });

    return Response.json({ user, listings });
  } catch (error) {
    return Response.json(
      { message: "Error fetching profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { phone, address, visitingHours, availableDays } = await req.json();

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const allowedDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const nextAvailableDays = Array.isArray(availableDays)
      ? availableDays.filter((day) => allowedDays.includes(day))
      : currentUser.availableDays || [];

    const nextVisitingHours = {
      start:
        typeof visitingHours?.start === "string"
          ? visitingHours.start
          : currentUser.visitingHours?.start || "",
      end:
        typeof visitingHours?.end === "string"
          ? visitingHours.end
          : currentUser.visitingHours?.end || "",
    };

    const user = await User.findByIdAndUpdate(
      userId,
      {
        phone: typeof phone === "string" ? phone : currentUser.phone,
        address: typeof address === "string" ? address : currentUser.address,
        visitingHours: nextVisitingHours,
        availableDays: nextAvailableDays,
      },
      { new: true }
    ).select("-password");

    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { message: "Error updating profile" },
      { status: 500 }
    );
  }
}
