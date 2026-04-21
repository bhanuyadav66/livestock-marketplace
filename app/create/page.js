"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PricePredictor from "@/components/PricePredictor";

export default function CreateListing() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    animalType: "",
    price: "",
    files: [],
    lat: "",
    lng: "",
    address: "",
    description: "",
  });
  const [uploading, setUploading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const reverseGeocode = async (lat, lng) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.display_name || null;
  };

  const detectCurrentLocation = () => {
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        setForm((current) => ({
          ...current,
          lat,
          lng,
        }));

        try {
          const address = await reverseGeocode(lat, lng);

          if (address) {
            setForm((current) => ({
              ...current,
              lat,
              lng,
              address,
            }));
            setLocationMessage("Current location and address detected successfully.");
          } else {
            setLocationMessage("Location detected. Address could not be resolved.");
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setLocationMessage("Location detected. Address lookup failed, so you can enter it manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setLocationMessage(
          "Unable to detect your location. Please enter latitude and longitude manually."
        );
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    if (!form.files.length) {
      alert("Please select at least one image");
      return;
    }

    try {
      setUploading(true);

      const uploadedImages = [];

      for (const file of form.files) {
        const imageData = new FormData();
        imageData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: imageData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          alert(uploadData.message || "Image upload failed");
          return;
        }

        uploadedImages.push(uploadData.url);
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          animalType: form.animalType,
          address: form.address,
          description: form.description,
          images: uploadedImages,
          price: Number(form.price),
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create listing");
        return;
      }

      alert("Listing created!");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ── AI Price Predictor (left on desktop) ── */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <PricePredictor
          defaultAnimal={form.animalType}
          onUseSuggestion={(price) => setForm(f => ({ ...f, price: String(price) }))}
        />
      </div>

      {/* ── Listing form (right on desktop) ── */}
      <div className="flex-1 min-w-0">
      <section className="soft-panel p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Listing</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new animal listing with photos, location, and details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            className="form-control"
          />

          <input
            name="animalType"
            placeholder="Animal Type (cow, goat, sheep...)"
            value={form.animalType}
            onChange={handleChange}
            className="form-control"
          />

          <input
            name="price"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={handleChange}
            className="form-control"
          />

          <textarea
            placeholder="Enter description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="form-control min-h-[120px]"
          />

          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <input
              id="file-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) =>
                setForm({ ...form, files: Array.from(e.target.files || []) })
              }
            />

            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="file-upload"
                className="inline-flex cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Choose Image
              </label>

              <span
                className={`text-sm font-medium ${
                  form.files.length ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                {form.files.length
                  ? `${form.files.length} image${
                      form.files.length === 1 ? "" : "s"
                    } selected`
                  : "No image selected"}
              </span>
            </div>

            {form.files.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="overflow-hidden rounded-xl border border-emerald-200 shadow-sm"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={208}
                      height={144}
                      unoptimized
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="lat"
              placeholder="Latitude (e.g. 17.385)"
              type="number"
              step="any"
              value={form.lat}
              onChange={handleChange}
              className="form-control"
            />

            <input
              name="lng"
              placeholder="Longitude (e.g. 78.4867)"
              type="number"
              step="any"
              value={form.lng}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={detectingLocation}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 disabled:opacity-60"
            >
              {detectingLocation ? "Detecting location..." : "Use Current Location"}
            </button>
            {locationMessage ? (
              <p className="text-sm text-gray-600">{locationMessage}</p>
            ) : null}
          </div>

          <input
            name="address"
            placeholder="Address (e.g. Hyderabad)"
            value={form.address}
            onChange={handleChange}
            className="form-control"
          />

          <button
            className="form-button max-w-[220px]"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </section>
      </div>
      </div>
    </div>
  );
}
