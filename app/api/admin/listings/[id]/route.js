import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { isAdmin } from "@/lib/isAdmin";

export async function DELETE(req, { params }) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await Listing.findByIdAndDelete(id);

  return Response.json({ message: "Deleted" });
}
