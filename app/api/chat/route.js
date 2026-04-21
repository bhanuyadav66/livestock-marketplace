import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import Notification from "@/models/Notification";
import User from "@/models/User";
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

export async function POST(req) {
  await connectDB();

  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const message = body.message?.trim();

  if (!body.listingId || !body.sellerId || !message) {
    return Response.json(
      { error: "Listing, seller and message are required" },
      { status: 400 }
    );
  }

  const isSellerReply = body.buyerId && body.sellerId === userId;
  const buyerId = isSellerReply ? body.buyerId : userId;

  let chat = await Chat.findOne({
    listingId: body.listingId,
    buyer: buyerId,
    seller: body.sellerId,
  });

  if (!chat) {
    chat = await Chat.create({
      listingId: body.listingId,
      buyer: buyerId,
      seller: body.sellerId,
      messages: [],
    });
  }

  chat.messages.push({
    sender: userId,
    text: message,
  });

  await chat.save();

  const recipientId = userId === body.sellerId ? buyerId : body.sellerId;
  const sender = await User.findById(userId).select("name");

  await Notification.create({
    userId: recipientId,
    text: `New message from ${sender?.name || "a user"}`,
    read: false,
    type: "message",
    refId: chat._id,
    link: "/inbox",
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .populate("listingId", "title")
    .populate("messages.sender", "name email");

  return Response.json(populatedChat);
}
