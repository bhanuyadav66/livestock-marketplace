import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import jwt from "jsonwebtoken";

function getUserId(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
}

export async function GET(req) {
  await connectDB();

  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chats = await Chat.find({
    $or: [{ seller: userId }, { buyer: userId }],
  })
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("listingId", "title animalType images price")
    .populate("messages.sender", "name email")
    .sort({ updatedAt: -1 });

  return Response.json(chats);
}
