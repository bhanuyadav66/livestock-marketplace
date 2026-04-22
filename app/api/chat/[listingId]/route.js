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

export async function GET(req, { params }) {
  await connectDB();

  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await params;
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");

  const query = {
    listingId,
    $or: [{ buyer: userId }, { seller: userId }],
  };

  if (buyerId) {
    query.buyer = buyerId;
  }

  const chat = await Chat.findOne(query);

  if (chat) {
    let changed = false;

    chat.messages.forEach((message) => {
      if (message.sender?.toString() !== userId && !message.seen) {
        message.seen = true;
        changed = true;
      }
    });

    if (changed) {
      await chat.save();
    }

    await chat.populate("buyer", "name email");
    await chat.populate("seller", "name email");
    await chat.populate("listingId", "title");
    await chat.populate("messages.sender", "name email");
  }

  return Response.json(chat || { messages: [] });
}

export async function PATCH(req, { params }) {
  await connectDB();

  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await params;
  const { buyerId } = await req.json();

  const query = {
    listingId,
    $or: [{ buyer: userId }, { seller: userId }],
  };

  if (buyerId) {
    query.buyer = buyerId;
  }

  const chat = await Chat.findOne(query);

  if (!chat) {
    return Response.json({ messages: [] });
  }

  let changed = false;

  chat.messages.forEach((message) => {
    if (message.sender?.toString() !== userId && !message.seen) {
      message.seen = true;
      changed = true;
    }
  });

  if (changed) {
    await chat.save();
  }

  return Response.json({ ok: true });
}
