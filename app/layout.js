import Link from "next/link";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import NotificationBell from "@/components/NotificationBell";
import DarkModeToggle from "@/components/DarkModeToggle";

export const metadata = {
  title: "Livestock Marketplace – Buy & Sell Animals Online",
  description: "Browse buffalo, goat, sheep, cow and poultry listings near you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', theme === 'dark' || (!theme && prefersDark));
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">



        {/* ── Main header ── */}
        <header className="w-full sticky top-0 z-50 shadow-md bg-[#232f3e] dark:bg-[#111827] transition-colors duration-200">
          <div className="w-full px-4 py-3 flex flex-wrap md:flex-nowrap items-center gap-4">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-2xl">🐄</span>
              <span className="text-lg font-bold leading-tight" style={{ color: "#febd69" }}>
                Livestock<br />
                <span className="text-white text-sm font-normal">Marketplace</span>
              </span>
            </Link>

            {/* Search bar — takes up the most space */}
            <form
              className="flex-1 flex max-w-3xl"
              action="/"
              method="get"
            >
              <input
                type="search"
                placeholder="Search for buffalo, goat, sheep, cow…"
                className="flex-1 rounded-l-md px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 outline-none border-0 transition-colors"
              />
              <button
                type="submit"
                className="rounded-r-md px-5 flex items-center justify-center transition hover:opacity-90"
                style={{ backgroundColor: "#febd69" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </form>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1 text-sm text-white flex-shrink-0">
              <Link href="/" className="px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition">
                Home
              </Link>
              <Link href="/create" className="px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition">
                + Sell
              </Link>

              {/* My Account */}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 8a7 7 0 1114 0H5z" clipRule="evenodd" />
                </svg>
                My Account
              </Link>

              {/* Favorites */}
              <Link
                href="/favorites"
                className="flex items-center gap-1.5 px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Favorites
              </Link>

              <NotificationBell />

              {/* My Listings */}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
                My Listings
              </Link>

              {/* Inbox */}
              <Link
                href="/inbox"
                className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded hover:outline hover:outline-1 hover:outline-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Inbox
              </Link>
              
              <div className="h-5 w-px bg-gray-500 mx-2" />
              <DarkModeToggle />
            </nav>

          </div>

        </header>

        {/* ── Page content ── */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="w-full mt-8 py-6 text-center text-xs bg-[#232f3e] dark:bg-[#111827] text-[#aab7c4] dark:text-gray-500 transition-colors duration-200">
          © {new Date().getFullYear()} Livestock Marketplace · Buy &amp; Sell Animals Online
        </footer>

      </body>
    </html>
  );
}
