import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isBlocked) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { listingId, reason } = await req.json();

    if (!listingId) {
      return Response.json(
        { message: "Listing is required" },
        { status: 400 }
      );
    }

    const report = await Report.create({
      listingId,
      reason: reason || "Suspicious listing",
      reportedBy: user._id,
    });

    return Response.json({ message: "Report submitted", report });
  } catch (error) {
    return Response.json(
      { message: "Error submitting report" },
      { status: 500 }
    );
  }
}
