import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const reports = await Report.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("listingId", "title animalType price")
    .populate("reportedBy", "name email");

  return Response.json({ reports });
}
