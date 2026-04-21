/**
 * Next.js proxy → FastAPI prediction microservice
 * GET /api/ai/predict?animalType=goat&age=3&location=hyderabad
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const animalType = searchParams.get("animalType") || "";
    const age        = searchParams.get("age")        || "1";
    const weight     = searchParams.get("weight")     || "50";
    const milking_capacity = searchParams.get("milkingCapacity") || "0";
    const location   = searchParams.get("location")   || "";

    if (!animalType) {
      return Response.json({ error: "animalType is required" }, { status: 400 });
    }

    const ML_API = process.env.ML_API_URL || "http://localhost:8000";
    const url    = `${ML_API}/predict?animalType=${encodeURIComponent(animalType)}&age=${age}&weight=${weight}&milking_capacity=${milking_capacity}&location=${encodeURIComponent(location)}`;

    const res  = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(
        { error: err.detail || "Prediction failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    console.error("Predict proxy error:", err);
    return Response.json(
      { error: "ML service unavailable. Make sure FastAPI is running on port 8000." },
      { status: 503 }
    );
  }
}
