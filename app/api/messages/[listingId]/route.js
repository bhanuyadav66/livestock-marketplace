import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";

export async function GET(req, context) {
  try {
    await connectDB();

    const { listingId } = await context.params;

    const messages = await Message.find({ listing: listingId })
      .populate("sender")
      .populate("receiver")
      .sort({ createdAt: 1 });

    return Response.json(messages);
  } catch (error) {
    console.log("GET MESSAGES ERROR:", error);
    return Response.json(
      { message: "Error fetching messages" },
      { status: 500 }
    );
  }
}
