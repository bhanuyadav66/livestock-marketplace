import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import OpenAI from "openai";

/* ──────────────────────────────────────────────────────────────
   OpenAI client (only initialised when API key is present)
────────────────────────────────────────────────────────────── */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* ──────────────────────────────────────────────────────────────
   RULE-BASED FALLBACK PARSER
   Used when: no API key, quota exceeded, or OpenAI unavailable
────────────────────────────────────────────────────────────── */
function parseQueryRuleBased(text) {
  const t = text.toLowerCase();
  const query = {};

  // Animal
  for (const animal of ["buffalo", "goat", "sheep", "cow", "poultry"]) {
    if (t.includes(animal)) { query.animalType = animal; break; }
  }

  // Price helpers
  const norm = (n, unit = "") => {
    const u = unit.toLowerCase();
    if (u.startsWith("l")) return n * 100000;
    if (u === "k") return n * 1000;
    return n;
  };

  const under = t.match(/(?:under|below|less than|max|upto|up to|within)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (under) query.price = { $lte: norm(parseFloat(under[1]), under[2]) };

  if (!query.price) {
    const bare = t.match(/₹?\s*(\d+\.?\d*)\s*(lakh|l|k)\b/i);
    if (bare) query.price = { $lte: norm(parseFloat(bare[1]), bare[2]) };
  }

  const above = t.match(/(?:above|over|more than|minimum|at least)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (above) query.price = { ...(query.price || {}), $gte: norm(parseFloat(above[1]), above[2]) };

  const between = t.match(/between\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?\s*(?:and|to|-)\s*₹?\s*(\d+\.?\d*)\s*(lakh|l|k)?/i);
  if (between) {
    query.price = {
      $gte: norm(parseFloat(between[1]), between[2]),
      $lte: norm(parseFloat(between[3]), between[4]),
    };
  }

  // Location (40+ Indian cities)
  const cities = [
    "hyderabad","bangalore","bengaluru","mumbai","delhi","chennai","kolkata",
    "pune","ahmedabad","jaipur","lucknow","surat","kanpur","nagpur","visakhapatnam",
    "bhopal","patna","ludhiana","agra","nashik","vadodara","rajkot","meerut",
    "varanasi","srinagar","amritsar","allahabad","ranchi","coimbatore","jodhpur",
    "indore","guwahati","chandigarh","mysore","raipur","kochi","trivandrum",
    "vijayawada","guntur","nellore","tirupati","warangal","nizamabad",
  ];
  for (const city of cities) {
    if (t.includes(city)) { query["location.address"] = new RegExp(city, "i"); break; }
  }

  // Age hints
  if (t.includes("young") || t.includes("calf") || t.includes("baby")) query.age = { $lte: 2 };
  if (t.includes("adult") || t.includes("mature")) query.age = { $gte: 3 };

  return query;
}

/* ──────────────────────────────────────────────────────────────
   OPENAI PARSER
   Asks GPT-4o-mini to return structured JSON from free text
────────────────────────────────────────────────────────────── */
async function parseQueryWithAI(message) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `You are a livestock marketplace filter extractor.
Convert the user query into a JSON object with these optional fields:
- "animalType": one of ["buffalo","goat","sheep","cow","poultry"]
- "maxPrice": number (in INR, convert k→×1000, lakh→×100000)
- "minPrice": number (in INR)
- "location": city name string (lowercase)
- "youngOnly": boolean (true if user wants young / baby / calf)

Return ONLY valid JSON. No explanation, no markdown, no code fences.
Example: {"animalType":"goat","maxPrice":50000,"location":"hyderabad"}`,
      },
      { role: "user", content: message },
    ],
  });

  // Strip any accidental markdown fences
  const raw = completion.choices[0].message.content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(raw);
}

/* ──────────────────────────────────────────────────────────────
   Convert parsed filter object → Mongoose query
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

  if (parsed.youngOnly) query.age = { $lte: 2 };

  // Always show available listings only
  query.$or = [
    { status: "available" },
    { status: { $exists: false } },
    { status: null },
  ];

  return query;
}

/* ──────────────────────────────────────────────────────────────
   Human-friendly reply builder
────────────────────────────────────────────────────────────── */
function buildReply(parsed, count, usedAI) {
  const tag = usedAI ? "🤖" : "🔍";
  const parts = [];

  if (parsed.animalType) parts.push(`**${parsed.animalType}**`);

  if (parsed.maxPrice && parsed.minPrice) {
    parts.push(`priced ₹${Number(parsed.minPrice).toLocaleString()} – ₹${Number(parsed.maxPrice).toLocaleString()}`);
  } else if (parsed.maxPrice) {
    parts.push(`under ₹${Number(parsed.maxPrice).toLocaleString()}`);
  } else if (parsed.minPrice) {
    parts.push(`above ₹${Number(parsed.minPrice).toLocaleString()}`);
  }

  if (parsed.location) {
    const loc = parsed.location;
    parts.push(`near **${loc.charAt(0).toUpperCase() + loc.slice(1)}**`);
  }

  if (count === 0) {
    return parts.length
      ? `😕 No ${parts.join(", ")} listings found right now. Try a different search!`
      : "😕 Couldn't find any listings matching that. Try rephrasing!";
  }

  return parts.length
    ? `${tag} Found **${count}** listing${count !== 1 ? "s" : ""} for ${parts.join(", ")}:`
    : `${tag} Here are **${count}** listing${count !== 1 ? "s" : ""} I found for you:`;
}

/* ──────────────────────────────────────────────────────────────
   POST /api/ai/chat
────────────────────────────────────────────────────────────── */
export async function POST(req) {
  try {
    await connectDB();

    const { message } = await req.json();
    if (!message?.trim()) {
      return Response.json({ reply: "Please type a message!", listings: [], suggestions: [] });
    }

    let parsed = {};
    let usedAI = false;

    // ── Try OpenAI first ──────────────────────────────────
    if (openai) {
      try {
        parsed = await parseQueryWithAI(message);
        usedAI = true;
        console.log("✅ OpenAI parsed:", parsed);
      } catch (aiErr) {
        console.warn("⚠️ OpenAI failed, falling back to rule-based:", aiErr.message);
        parsed = parseQueryRuleBased(message);
      }
    } else {
      // No API key — use rule-based
      parsed = parseQueryRuleBased(message);
    }

    // ── Query MongoDB ─────────────────────────────────────
    const mongoQuery = buildMongoQuery(parsed);
    const listings = await Listing.find(mongoQuery)
      .sort({ views: -1, createdAt: -1 })
      .limit(6)
      .populate("seller", "name phone");

    const reply = buildReply(parsed, listings.length, usedAI);

    // ── Smart follow-up suggestions ───────────────────────
    const suggestions = [];
    if (parsed.animalType) {
      suggestions.push(`${parsed.animalType} under ₹30,000`);
      suggestions.push(`young ${parsed.animalType} for sale`);
    } else {
      suggestions.push("Buffalo under ₹50,000 near Hyderabad");
      suggestions.push("Cheap goat near Pune");
      suggestions.push("Sheep between ₹10k and ₹30k");
    }

    return Response.json({ reply, listings, suggestions, usedAI });
  } catch (error) {
    console.error("AI Chat error:", error);
    return Response.json(
      { reply: "⚠️ Something went wrong. Please try again.", listings: [], suggestions: [] },
      { status: 500 }
    );
  }
}
