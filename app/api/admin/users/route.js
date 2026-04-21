import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(50);

  return Response.json({ users });
}
