import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import SearchStat from "@/models/SearchStat";
import { isAdmin } from "@/lib/isAdmin";

export async function GET(req) {
  try {
    await connectDB();

    const admin = await isAdmin(req);

    if (!admin) {
      return Response.json({ message: "Unauthorized" }, { status: 403 });
    }

    const totalListings = await Listing.countDocuments();
    const totalAvailableListings = await Listing.countDocuments({ status: "available" });
    const totalSoldListings = await Listing.countDocuments({ status: "sold" });

    const avgPrice = await Listing.aggregate([
      {
        $group: {
          _id: null,
          avg: { $avg: "$price" },
        },
      },
    ]);

    const byType = await Listing.aggregate([
      {
        $group: {
          _id: "$animalType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const topSellers = await Listing.aggregate([
      {
        $group: {
          _id: "$seller",
          totalListings: { $sum: 1 },
        },
      },
      { $sort: { totalListings: -1 } },
      { $limit: 5 },
    ]);

    const avgPricePerCategory = await Listing.aggregate([
      {
        $group: {
          _id: "$animalType",
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);

    const topCities = await Listing.aggregate([
      {
        $group: {
          _id: "$location.address",
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mostSearchedAnimal = await SearchStat.findOne({ type: "animalType" })
      .sort({ count: -1 })
      .lean();

    const mostActiveLocation = await SearchStat.findOne({ type: "location" })
      .sort({ count: -1 })
      .lean();

    return Response.json({
      totalListings,
      totalAvailableListings,
      totalSoldListings,
      avgPrice: avgPrice[0]?.avg || 0,
      byType,
      topSellers,
      avgPricePerCategory,
      topCities,
      mostSearchedAnimal,
      mostActiveLocation,
    });
  } catch (error) {
    console.log("ANALYTICS ERROR:", error);
    return Response.json(
      { message: "Error fetching analytics" },
      { status: 500 }
    );
  }
}
