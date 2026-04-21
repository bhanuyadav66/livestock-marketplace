import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(req) {
  await connectDB();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = new mongoose.Types.ObjectId(decoded.id);

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
      },
    },
    {
      $project: {
        user: {
          $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
        },
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: "$user",
        lastMessageAt: { $max: "$createdAt" },
      },
    },
    {
      $sort: {
        lastMessageAt: -1,
      },
    },
  ]);

  const users = await User.find({
    _id: { $in: conversations.map((conversation) => conversation._id) },
  }).select("name email");

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return Response.json(
    conversations
      .map((conversation) => userMap.get(conversation._id.toString()))
      .filter(Boolean)
  );
}
