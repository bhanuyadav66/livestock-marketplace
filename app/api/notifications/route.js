import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
}

export async function GET(req) {
  try {
    await connectDB();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return Response.json(notifications);
  } catch (error) {
    return Response.json(
      { message: "Error fetching notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, read = true, markAll = false } = await req.json();

    if (markAll) {
      await Notification.updateMany({ userId, read: false }, { $set: { read } });
      return Response.json({ message: "Notifications updated" });
    }

    if (!notificationId) {
      return Response.json(
        { message: "Notification ID is required" },
        { status: 400 }
      );
    }

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read } }
    );

    return Response.json({ message: "Notification updated" });
  } catch (error) {
    return Response.json(
      { message: "Error updating notification" },
      { status: 500 }
    );
  }
}
