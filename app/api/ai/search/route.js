import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* ──────────────────────────────────────────────────────────────
   RULE-BASED FALLBACK PARSER
────────────────────────────────────────────────────────────── */
function parseQueryRuleBased(text) {
  const t = text.toLowerCase();
  const query = {};

  for (const animal of ["buffalo", "goat", "sheep", "cow", "poultry"]) {
    if (t.includes(animal)) { query.animalType = animal; break; }
  }

  const norm = (n, unit = "") => {
    const u = unit.toLowerCase();
    if (u.startsWith("l")) return n * 100000;
    if (u === "k") return n * 1000;
    return n;
  };

  const under = t.match(/(?:under|below|less than|max|upto|up to|within)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (under) query.maxPrice = norm(parseFloat(under[1]), under[2]);

  if (!query.maxPrice) {
    const bare = t.match(/₹?\s*(\d+\.?\d*)\s*(lakh|l|k)\b/i);
    if (bare) query.maxPrice = norm(parseFloat(bare[1]), bare[2]);
  }

  const above = t.match(/(?:above|over|more than|minimum|at least)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (above) query.minPrice = norm(parseFloat(above[1]), above[2]);

  const between = t.match(/between\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?\s*(?:and|to|-)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (between) {
    query.minPrice = norm(parseFloat(between[1]), between[2]);
    query.maxPrice = norm(parseFloat(between[3]), between[4]);
  }

  const cities = [
    "hyderabad","bangalore","bengaluru","mumbai","delhi","chennai","kolkata",
    "pune","ahmedabad","jaipur","lucknow","surat","kanpur","nagpur","visakhapatnam"
  ];
  for (const city of cities) {
    if (t.includes(city)) { query.location = city; break; }
  }

  return query;
}

/* ──────────────────────────────────────────────────────────────
   OPENAI PARSER
────────────────────────────────────────────────────────────── */
async function parseQueryWithAI(message) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `You are a livestock search filter extractor.
Convert the user query into a JSON object with these optional fields:
- "animalType": one of ["buffalo","goat","sheep","cow","poultry"]
- "maxPrice": number (in INR, convert k to ×1000, lakh to ×100000)
- "minPrice": number (in INR)
- "location": city name string (lowercase)

Return ONLY valid JSON.`,
      },
      { role: "user", content: message },
    ],
  });

  const raw = completion.choices[0].message.content.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(raw);
}

/* ──────────────────────────────────────────────────────────────
   MONGO QUERY BUILDER
────────────────────────────────────────────────────────────── */
function buildMongoQuery(parsed) {
  const query = {};

  if (parsed.animalType) query.animalType = parsed.animalType.toLowerCase();

  if (parsed.maxPrice || parsed.minPrice) {
    query.price = {};
    if (parsed.maxPrice) query.price.$lte = Number(parsed.maxPrice);
    if (parsed.minPrice) query.price.$gte = Number(parsed.minPrice);
  }

  if (parsed.location) {
    query["location.address"] = new RegExp(parsed.location, "i");
  }

  query.$or = [{ status: "available" }, { status: { $exists: false } }, { status: null }];
  return query;
}

/* ──────────────────────────────────────────────────────────────
   POST /api/ai/search
────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    await connectDB();
    const { query } = await req.json();

    if (!query?.trim()) {
      return Response.json({ filters: null, listings: [], usedAI: false });
    }

    let parsed = {};
    let usedAI = false;

    if (openai) {
      try {
        parsed = await parseQueryWithAI(query);
        usedAI = true;
      } catch (e) {
        console.warn("OpenAI search failed, falling back to rule-based:", e.message);
        parsed = parseQueryRuleBased(query);
      }
    } else {
      parsed = parseQueryRuleBased(query);
    }

    const mongoQuery = buildMongoQuery(parsed);
    const listings = await Listing.find(mongoQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(10)
      .populate("seller", "name phone");

    return Response.json({ filters: parsed, listings, usedAI });

  } catch (error) {
    console.error("AI Search error:", error);
    return Response.json(
      { message: "AI search failed", listings: [], filters: null },
      { status: 500 }
    );
  }
}
