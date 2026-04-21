import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const body = await req.json();

  if (!body.receiverId || !body.text?.trim()) {
    return Response.json(
      { error: "Receiver ID and message text are required" },
      { status: 400 }
    );
  }

  const message = await Message.create({
    sender: decoded.id,
    receiver: body.receiverId,
    text: body.text.trim(),
  });

  const sender = await User.findById(decoded.id).select("name");
  await Notification.create({
    userId: body.receiverId,
    text: `New message from ${sender?.name || "a buyer"}`,
    read: false,
    type: "message",
    refId: message._id,
    link: `/inbox?user=${decoded.id}`,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "name email")
    .populate("receiver", "name email");

  return Response.json(populatedMessage);
}

export async function GET(req) {
  await connectDB();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const { searchParams } = new URL(req.url);
  const receiverId = searchParams.get("receiverId");

  if (!receiverId) {
    return Response.json({ error: "Receiver ID is required" }, { status: 400 });
  }

  const messages = await Message.find({
    $or: [
      { sender: decoded.id, receiver: receiverId },
      { sender: receiverId, receiver: decoded.id },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name email")
    .populate("receiver", "name email");

  return Response.json(messages);
}
