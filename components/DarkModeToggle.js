"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === "undefined") return;

      const prefersDark =
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      document.documentElement.classList.toggle("dark", prefersDark);
      setDark(prefersDark);
      setMounted(true);
    });
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="ml-2 flex items-center gap-1.5 rounded px-3 py-2 text-white transition hover:outline hover:outline-1 hover:outline-white"
      aria-label="Toggle Dark Mode"
      title="Toggle dark mode"
    >
      <span className="text-sm font-semibold leading-none">
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
