import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import mongoose from "mongoose";
import User from "@/models/User";
import SearchStat from "@/models/SearchStat";
import jwt from "jsonwebtoken";
export async function POST(req) {
  try {
    await connectDB();

    // 🔐 Verify JWT token
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id); // ✅ matches { id: user._id } in login
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    console.log("BODY:", body);
    console.log("Fetching listings...");

    const { title, animalType, price, age, description, image, images, location } =
      body;

    const normalizedTitle = title?.trim();
    const normalizedAnimalType = animalType?.trim().toLowerCase();
    const normalizedPrice = Number(price);
    const normalizedAge =
      age === "" || age === undefined ? undefined : Number(age);

    if (!normalizedTitle) {
      return Response.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    if (!normalizedAnimalType) {
      return Response.json(
        { message: "Animal type is required" },
        { status: 400 }
      );
    }

    if (
      !["buffalo", "goat", "sheep", "cow", "poultry"].includes(
        normalizedAnimalType
      )
    ) {
      return Response.json(
        { message: "Animal type is invalid" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return Response.json(
        { message: "Price must be a valid number" },
        { status: 400 }
      );
    }

    if (
      normalizedAge !== undefined &&
      (!Number.isFinite(normalizedAge) || normalizedAge < 0)
    ) {
      return Response.json(
        { message: "Age must be a valid number" },
        { status: 400 }
      );
    }


    // ✅ Bug fix: validate location fields are present
    if (!body.lat || !body.lng) {
      return Response.json(
        { message: "Location required" },
        { status: 400 }
      );
    }

    const fallbackImage =
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=500";
    const normalizedImages = Array.isArray(images) && images.length > 0
      ? images.filter((item) => typeof item === "string" && item.startsWith("http"))
      : image?.startsWith("http")
      ? [image]
      : [fallbackImage];

    // upload image to cloudinary
    //const uploadRes = await cloudinary.uploader.upload(image);
    const listing = await Listing.create({
      title: body.title,
      animalType: body.animalType.toLowerCase(),
      price: Number(body.price),
      description: body.description, // ✅ MUST EXIST
      status: body.status === "sold" ? "sold" : "available",
      images: normalizedImages,

      location: {
        type: "Point",
        coordinates: [Number(body.lng), Number(body.lat)], // ✅ [lng, lat] — MongoDB order
        address: body.address,
      },

      seller: user._id,
    });

    return Response.json({
      message: "Listing created",
      listing,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const search     = searchParams.get("search") || "";
    const animalType = searchParams.get("animalType");
    const maxPrice   = searchParams.get("maxPrice");
    const lat        = searchParams.get("lat");
    const lng        = searchParams.get("lng");
    const radius     = searchParams.get("radius");
    const sortParam  = searchParams.get("sort") || "newest";

    const pageParam = Number(searchParams.get("page"));
    const limitParam = Number(searchParams.get("limit"));
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isInteger(limitParam) && limitParam > 0
        ? Math.min(limitParam, 50)
        : 10;
    const skip       = (page - 1) * limit;

    // Build Mongoose sort object
    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      newest:     { createdAt: -1 },
      popular:    { views: -1 },
      featured:   { createdAt: -1 },
    };
    const mongoSort = sortMap[sortParam] || { createdAt: -1 };

    let query = {};

    // ✅ Status filter — show only available listings
    query.$or = [
      { status: "available" },
      { status: { $exists: false } },
      { status: null },
    ];

    // ✅ TEXT SEARCH across title, animalType, and address
    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { animalType: { $regex: search, $options: "i" } },
            { "location.address": { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    // ✅ ANIMAL TYPE FILTER
    if (animalType && animalType !== "all") {
      query.animalType = animalType.toLowerCase();
    }

    // ✅ PRICE FILTER
    if (maxPrice && Number(maxPrice) > 0) {
      query.price = { $lte: Number(maxPrice) };
    }

    // ✅ GEO FILTER — only when ALL three values are present
    if (lat && lng && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: Number(radius),
        },
      };

      // Track location search stats
      const roundedLocation = `${Number(lat).toFixed(1)},${Number(lng).toFixed(1)}`;
      await SearchStat.findOneAndUpdate(
        { type: "location", value: roundedLocation },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    }

    // ✅ Track animal type search stats
    if (animalType && animalType !== "all") {
      await SearchStat.findOneAndUpdate(
        { type: "animalType", value: animalType.toLowerCase() },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    }

    let listings = await Listing.find(query).sort(mongoSort).skip(skip).limit(limit).populate("seller");
    let totalCount = await Listing.countDocuments(query);

    // ✅ FALLBACK: if geo filtered but no results, show all matching listings without geo
    if (listings.length === 0 && lat && lng && radius) {
      const fallbackQuery = {};

      fallbackQuery.$or = [
        { status: "available" },
        { status: { $exists: false } },
        { status: null },
      ];

      if (animalType && animalType !== "all") {
        fallbackQuery.animalType = animalType.toLowerCase();
      }

      if (maxPrice && Number(maxPrice) > 0) {
        fallbackQuery.price = { $lte: Number(maxPrice) };
      }

      if (search) {
        fallbackQuery.$and = [
          {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { animalType: { $regex: search, $options: "i" } },
              { "location.address": { $regex: search, $options: "i" } },
            ],
          },
        ];
      }

      listings = await Listing.find(fallbackQuery).sort(mongoSort).skip(skip).limit(limit).populate("seller");
      totalCount = await Listing.countDocuments(fallbackQuery);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return Response.json({
      listings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.log("GET ERROR:", error);
    return Response.json(
      { message: "Error fetching listings", error: error.message },
      { status: 500 }
    );
  }
}
