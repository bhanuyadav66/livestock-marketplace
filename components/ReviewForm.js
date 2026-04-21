"use client";

import { useState } from "react";
import axios from "axios";

export default function ReviewForm({ listingId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to rate this listing.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "/api/reviews",
        {
          rating: Number(rating),
          comment,
          listing: listingId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComment("");
      setRating(5);
      alert("Review added!");
      onSubmitted?.();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to add review right now.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <label className="form-label">Rating</label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="form-control max-w-[160px]"
        />
      </div>

      <div className="space-y-2">
        <label className="form-label">Comment</label>
        <textarea
          placeholder="Write review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="form-control min-h-[120px]"
        />
      </div>

      <button disabled={loading} className="form-button max-w-[180px]">
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
