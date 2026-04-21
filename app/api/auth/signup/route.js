import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    console.log("SIGNUP HIT"); // 🧪 debug
    await connectDB();
    const body = await req.json();


    const { name, email, password, phone, address } = body;

    if (!name || !email || !password) {
      return Response.json(
        { message: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return Response.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      address: address || "",
    });

    return Response.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log("SIGNUP ERROR:", error);

    if (error.code === 11000) {
      return Response.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
