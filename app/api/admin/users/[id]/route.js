import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isAdmin } from "@/lib/isAdmin";

export async function PATCH(req, { params }) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const isBlocked = body.isBlocked ?? true;

  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked },
    { new: true }
  ).select("-password");

  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
}
