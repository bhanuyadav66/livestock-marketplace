import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function isAdmin(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    return user?.role === "admin";
  } catch {
    return false;
  }
}
