import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return Response.json(
        { message: "Your account has been blocked" },
        { status: 403 }
      );
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // strip sensitive fields before returning
    const { password: _, ...safeUser } = user.toObject();

    return Response.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    return Response.json(
      { message: "Error logging in" },
      { status: 500 }
    );
  }
}
