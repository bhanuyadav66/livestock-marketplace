import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Listing from "@/models/Listing";
import Report from "@/models/Report";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req) {
  await connectDB();

  const admin = await isAdmin(req);

  if (!admin) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  const users = await User.countDocuments();
  const listings = await Listing.countDocuments();
  const reports = await Report.countDocuments();

  const topAnimalData = await Listing.aggregate([
    { $group: { _id: "$animalType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const animalStats = await Listing.aggregate([
    { $group: { _id: "$animalType", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const cityStats = await Listing.aggregate([
    { $group: { _id: "$location.address", count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
  ]);

  const topCities = await Listing.aggregate([
    { $group: { _id: "$location.address", count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  return Response.json({
    users,
    listings,
    reports,
    topAnimal: topAnimalData[0]?._id || "N/A",
    animalStats,
    cityStats,
    topCities,
  });
}
