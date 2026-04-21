"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      alert("Account created! Please login.");
      router.push("/login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-shell">
      <div className="form-card" style={{ maxWidth: "520px" }}>
        <h1 className="form-title">Create Account</h1>
        <p className="form-subtitle">
          Join the livestock marketplace today
        </p>

        {error ? <div className="form-error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="form-stack">
          <label className="form-label">Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
            required
            className="form-control"
          />

          <label className="form-label">Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            className="form-control"
          />

          <label className="form-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            className="form-control"
          />

          <label className="form-label">Phone (optional)</label>
          <input
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={handleChange}
            className="form-control"
          />

          <label className="form-label">Address (optional)</label>
          <input
            name="address"
            type="text"
            placeholder="City, State"
            value={form.address}
            onChange={handleChange}
            className="form-control"
          />

          <button type="submit" disabled={loading} className="form-button">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="form-footer">
          Already have an account?{" "}
          <Link href="/login" className="form-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
